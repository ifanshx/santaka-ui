/**
 * CLI commands (plan.md §8).
 *
 * Every command returns a result and a stream of lines rather than printing
 * directly, so the same code path serves `--dry-run`, the tests, and a real run.
 * A command that prints as it goes cannot be tested without capturing stdout,
 * and cannot be made dry-run without a second implementation that drifts.
 *
 * The two rules that shape the whole file:
 *
 *   - **A run either completes or leaves nothing behind.** Writes go through
 *     `applyWrites`, which journals and rolls back. The manifest is written only
 *     after the files land.
 *   - **A modified file is never overwritten without consent.** A conflict stops
 *     the run with exit code 2, prints a unified diff, and names the flags that
 *     resolve it. Nothing is written.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { RegistryItem } from "@santaka-ui/core"
import { applyWrites, type WritePlanEntry } from "./fs-safe.js"
import {
  compareFiles,
  emptyManifest,
  manifestPath,
  readManifest,
  recordItem,
  removeItem,
  writeManifest,
  type Manifest,
} from "./manifest.js"
import { renderDiff } from "./diff.js"
import { detectProject, resolveFramework, SUPPORTED_FRAMEWORKS, type Detection } from "./detect.js"
import {
  fetchRemoteRegistry,
  findItem,
  loadBundledRegistry,
  readRegistryConfig,
  resolveClosure,
  resolveItemFiles,
  typeCounts,
  writeRegistryConfig,
  type LoadedRegistry,
  type ResolveOutcome,
} from "./registry.js"

/** Exit codes §8 defines. `2` is a conflict, and it is load-bearing. */
export const EXIT = { ok: 0, error: 1, conflict: 2 } as const

export type CommandResult = {
  code: number
  lines: string[]
}

export type CommandContext = {
  cwd: string
  dryRun: boolean
  overwrite: boolean
  skip: boolean
  /** Colour helpers, injected so the command layer has no terminal opinion. */
  paint: {
    ok: (text: string) => string
    warn: (text: string) => string
    error: (text: string) => string
    dim: (text: string) => string
    bold: (text: string) => string
  }
}

/** Load the bundled registry plus any configured remote ones. */
export async function loadRegistry(cwd: string): Promise<LoadedRegistry> {
  const bundled = loadBundledRegistry()
  const config = readRegistryConfig(cwd)
  const items = [...bundled.items]
  const sources = [...bundled.sources]
  const rejected = [...bundled.rejected]

  for (const url of config.registries) {
    try {
      const remote = await fetchRemoteRegistry(url)
      // A bundled entry wins a name collision: the reviewed copy is the one to
      // install, and a remote cannot silently replace it.
      const bundledNames = new Set(items.map((item) => item.name))
      for (const item of remote.items) {
        if (!bundledNames.has(item.name)) items.push(item)
      }
      sources.push(...remote.sources)
      rejected.push(...remote.rejected)
    } catch (error) {
      rejected.push({
        name: url,
        errors: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  return { items, sources, rejected }
}

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

export type InitOptions = {
  framework?: string
  registry?: string
}

/**
 * `santaka init` — detect the project, write the theme entrypoint, print what
 * to do next.
 *
 * It deliberately does **not** install dependencies. §8's requirement is to
 * "document CSS/build requirements", and running a package manager from a
 * scaffolding tool means the tool can no longer tell a network failure from a
 * permissions failure from a version conflict. The commands are printed, which
 * the consumer can read before running.
 */
export async function init(ctx: CommandContext, options: InitOptions = {}): Promise<CommandResult> {
  const lines: string[] = []
  const detection = detectProject(ctx.cwd)
  const resolved = resolveFramework(detection, options.framework)

  lines.push(ctx.paint.bold("Santaka UI — project setup"))
  lines.push("")
  lines.push(...describeDetection(detection, ctx))

  if (resolved.problems.length > 0) {
    for (const problem of resolved.problems) lines.push(ctx.paint.error(`✖ ${problem}`))
    return { code: EXIT.error, lines }
  }
  const framework = resolved.framework
  if (framework === null) {
    lines.push(ctx.paint.error("✖ Could not determine a framework."))
    return { code: EXIT.error, lines }
  }

  lines.push("")
  lines.push(`Framework: ${ctx.paint.bold(framework)}`)
  if (options.framework && detection.framework && options.framework !== detection.framework) {
    lines.push(
      ctx.paint.dim(
        `  (override: the files suggest ${detection.framework}; using ${options.framework} as asked)`,
      ),
    )
  }

  if (options.registry) {
    const config = readRegistryConfig(ctx.cwd)
    if (!config.registries.includes(options.registry)) {
      config.registries.push(options.registry)
      if (!ctx.dryRun) writeRegistryConfig(ctx.cwd, config)
      lines.push(`Registered source: ${options.registry}`)
    }
  }

  // The theme entrypoint is the one file init writes. It is the documented
  // import list (section 4's distribution contract), so a consumer who never
  // runs the CLI again still has the contract in their repo.
  const themeFile = join(ctx.cwd, "santaka-theme.css")
  const themeContent = renderThemeEntrypoint()
  const plan: WritePlanEntry[] = [
    {
      destination: themeFile,
      content: themeContent,
      action: existsSync(themeFile) ? "replace" : "create",
    },
  ]

  lines.push("")
  lines.push(...describeInstallCommands(detection.packageManager, framework, ctx))

  if (ctx.dryRun) {
    lines.push("")
    lines.push(ctx.paint.dim(`[dry run] would write ${relativeTo(ctx.cwd, themeFile)}`))
    return { code: EXIT.ok, lines }
  }

  const result = applyWrites(plan)
  for (const path of result.written) {
    lines.push(ctx.paint.ok(`✓ wrote ${relativeTo(ctx.cwd, path)}`))
  }
  for (const path of result.unchanged) {
    lines.push(ctx.paint.dim(`· ${relativeTo(ctx.cwd, path)} already up to date`))
  }

  return { code: EXIT.ok, lines }
}

// ---------------------------------------------------------------------------
// add
// ---------------------------------------------------------------------------

export type AddOptions = {
  names: string[]
  /** Copy source (default) or record a package-mode intent. */
  source?: boolean
}

/**
 * `santaka add <component...>` — copy a component's source into the project.
 *
 * Order of operations, and why:
 *
 *   1. Resolve every requested component and every file **before** writing
 *      anything, so a typo in the third name does not leave the first two
 *      installed.
 *   2. Compare against the manifest. A `modified` file is a conflict: print the
 *      diff, exit 2, write nothing.
 *   3. Write through the journal. On success, record hashes.
 */
export async function add(ctx: CommandContext, options: AddOptions): Promise<CommandResult> {
  const lines: string[] = []
  if (options.names.length === 0) {
    lines.push(ctx.paint.error("✖ Name at least one item: santaka add button dialog"))
    return { code: EXIT.error, lines }
  }

  const registry = await loadRegistry(ctx.cwd)
  const { manifest, error: manifestError } = readManifest(ctx.cwd)
  if (manifestError) {
    lines.push(ctx.paint.warn(`! ${manifestError}`))
  }

  const unknown: string[] = []
  const items: RegistryItem[] = []
  for (const name of options.names) {
    const item = findItem(registry, name)
    if (item) items.push(item)
    else unknown.push(name)
  }
  const rootsByName = new Set(items.map((item) => item.name))

  if (unknown.length > 0) {
    lines.push(ctx.paint.error(`✖ Unknown item(s): ${unknown.join(", ")}`))
    lines.push("")
    lines.push("Available:")
    lines.push(...listNames(registry, ctx))
    return { code: EXIT.error, lines }
  }

  // The plan is the dependency closure of every requested name, depth-first:
  // dependencies first, then the item itself. `add block` installs the
  // block *and* the components it composes (ADR-022); `add button` resolves
  // to just `button`, so a dependency-free install behaves exactly as before.
  const closure = resolveClosure(registry, items)
  if (!closure.ok) {
    lines.push(ctx.paint.error(`✖ Dependency cycle: ${closure.reason}`))
    return { code: EXIT.error, lines }
  }
  if (closure.missing.length > 0) {
    for (const missing of closure.missing) {
      lines.push(
        ctx.paint.error(
          `✖ ${missing.requestedBy} depends on "${missing.name}", which is not in any configured registry.`,
        ),
      )
    }
    return { code: EXIT.error, lines }
  }
  const planned = closure.items
  const dependencies = planned.filter((item) => !rootsByName.has(item.name))
  if (dependencies.length > 0) {
    lines.push(ctx.paint.dim(`dependencies of ${items.map((item) => item.name).join(", ")}:`))
    for (const item of dependencies) lines.push(ctx.paint.dim(`  ${item.name}`))
  }

  // Resolve every file up front: a checksum mismatch or a bad path on the last
  // component must not leave the first ones written.
  const resolved: Array<{ item: RegistryItem; files: ResolveOutcome }> = []
  for (const item of planned) {
    const files = resolveItemFiles(item, ctx.cwd)
    if (!files.ok) {
      lines.push(ctx.paint.error(`✖ ${files.reason}`))
      return { code: EXIT.error, lines }
    }
    resolved.push({ item, files })
  }

  // Conflict detection. A file is in conflict when it exists, differs from what
  // the registry supplies, and the CLI cannot prove it wrote it. Both cases
  // count: tracked-but-edited (the manifest hash disagrees) and untracked (the
  // CLI has no record, so it cannot know what the file is).
  //
  // Detection and *stopping* are separate. A conflict always gets reported; it
  // only stops the run when the consumer has not chosen `--overwrite` or
  // `--skip`. §8's model is "print the diff and exit 2, then the consumer
  // chooses" — so a run that has been told how to proceed must proceed.
  const conflictEntries: Array<{
    path: string
    absolute: string
    current: string
    incoming: string
  }> = []
  for (const { item, files } of resolved) {
    if (!files.ok) continue
    const recorded = manifest.items[item.name]
    for (const file of files.files) {
      const absolute = join(ctx.cwd, file.destination)
      if (!existsSync(absolute)) continue
      const current = readFileSync(absolute, "utf8")
      const incoming = readFileSync(file.source, "utf8")
      if (current === incoming) continue

      const trackedHash = recorded?.files[file.destination]
      const editedSinceInstall = trackedHash !== undefined
      const unknownToTheCli = trackedHash === undefined
      if (editedSinceInstall || unknownToTheCli) {
        conflictEntries.push({ path: file.destination, absolute, current, incoming })
      }
    }
  }

  const hasConflict = conflictEntries.length > 0
  const mustStop = hasConflict && !ctx.overwrite && !ctx.skip

  if (mustStop) {
    lines.push(
      ctx.paint.warn(
        `! ${conflictEntries.length} file(s) already exist and differ from what the registry supplies.`,
      ),
    )
    lines.push("")
    for (const entry of conflictEntries) {
      lines.push(
        renderDiff(
          entry.current,
          entry.incoming,
          { old: `${entry.path} (yours)`, new: `${entry.path} (registry)` },
          {
            paint: {
              add: (text) => ctx.paint.ok(text),
              remove: (text) => ctx.paint.error(text),
              hunk: (text) => ctx.paint.dim(text),
            },
          },
        ),
      )
      lines.push("")
    }
    lines.push("Nothing was written. Choose one:")
    lines.push("  --overwrite   replace the files above with the registry copy")
    lines.push("  --skip        leave them and install everything else")
    return { code: EXIT.conflict, lines }
  }

  if (hasConflict && ctx.skip) {
    lines.push(
      ctx.paint.warn(
        `! leaving ${conflictEntries.length} file(s) you have edited, installing the rest:`,
      ),
    )
    for (const entry of conflictEntries) lines.push(`  ${entry.path}`)
    lines.push("")
  }

  // Build the write plan. Under `--skip` the conflicting files are excluded;
  // under `--overwrite` they are replaced like any other.
  const skippedPaths = new Set(ctx.skip ? conflictEntries.map((entry) => entry.path) : [])
  const plan: WritePlanEntry[] = []
  const skipped: string[] = []
  for (const { files } of resolved) {
    if (!files.ok) continue
    for (const file of files.files) {
      const absolute = join(ctx.cwd, file.destination)
      if (skippedPaths.has(file.destination)) {
        skipped.push(file.destination)
        continue
      }
      plan.push({
        destination: absolute,
        content: readFileSync(file.source),
        action: existsSync(absolute) ? "replace" : "create",
      })
    }
  }

  if (ctx.dryRun) {
    lines.push(ctx.paint.dim("[dry run] would write:"))
    for (const entry of resolved) {
      if (!entry.files.ok || entry.files.files.length === 0) continue
      lines.push(`  ${entry.item.name}`)
      for (const file of entry.files.files) {
        const destination = join(ctx.cwd, file.destination)
        if (skippedPaths.has(file.destination)) continue
        lines.push(`    ${relativeTo(ctx.cwd, destination)}`)
      }
    }
    for (const path of skipped) lines.push(`  ${path} ${ctx.paint.dim("(skipped)")}`)
    return { code: EXIT.ok, lines }
  }

  const result = applyWrites(plan)

  // The manifest is written only after the files land, so a failed write leaves
  // the previous manifest intact and the run is safe to repeat.
  let updated: Manifest = manifest
  for (const { item, files } of resolved) {
    if (!files.ok) continue
    const written = files.files.filter((file) =>
      result.written.includes(join(ctx.cwd, file.destination)),
    )
    if (written.length === 0 && manifest.items[item.name]) continue
    updated = recordItem(
      updated,
      item.name,
      item.version,
      written.map((file) => ({
        path: file.destination,
        absolute: join(ctx.cwd, file.destination),
      })),
    )
  }
  writeManifest(ctx.cwd, updated)

  for (const path of result.written) lines.push(ctx.paint.ok(`✓ ${relativeTo(ctx.cwd, path)}`))
  for (const path of skipped) lines.push(ctx.paint.dim(`· skipped ${path}`))
  lines.push("")
  lines.push(
    `Installed ${planned.map((item) => item.name).join(", ")}. Recorded in ${manifestPath(ctx.cwd)
      .replace(ctx.cwd, "")
      .replace(/^[\\/]/, "")}.`,
  )
  return { code: EXIT.ok, lines }
}

// ---------------------------------------------------------------------------
// list, doctor, diff, theme, registry, update
// ---------------------------------------------------------------------------

export async function list(ctx: CommandContext): Promise<CommandResult> {
  const lines: string[] = []
  const registry = await loadRegistry(ctx.cwd)
  // Counts by item type, derived from the entries rather than from a list of
  // type names: an entry whose type is new or unexpected is still counted and
  // still shown (ADR-022 §4), so a future kind cannot silently vanish from the
  // total.
  lines.push(ctx.paint.bold(typeCounts(registry.items)))
  lines.push("")
  lines.push(...listNames(registry, ctx))
  const { manifest } = readManifest(ctx.cwd)
  const installed = Object.keys(manifest.items)
  if (installed.length > 0) {
    lines.push("")
    lines.push(ctx.paint.bold(`Installed (${installed.length})`))
    for (const name of installed) {
      lines.push(`  ${name} ${ctx.paint.dim(manifest.items[name]?.version ?? "")}`)
    }
  }
  return { code: EXIT.ok, lines }
}

/**
 * `santaka doctor` — report what the project is, what the CLI can see, and what
 * is wrong. It never changes anything.
 */
export async function doctor(ctx: CommandContext): Promise<CommandResult> {
  const lines: string[] = []
  const detection = detectProject(ctx.cwd)
  lines.push(ctx.paint.bold("santaka doctor"))
  lines.push("")
  lines.push(...describeDetection(detection, ctx))

  const { manifest, error } = readManifest(ctx.cwd)
  lines.push("")
  if (error) {
    lines.push(ctx.paint.error(`✖ ${error}`))
  } else {
    const installed = Object.keys(manifest.items)
    lines.push(
      `Manifest: ${manifestPath(ctx.cwd)
        .replace(ctx.cwd, "")
        .replace(/^[\\/]/, "")}`,
    )
    lines.push(`Installed components: ${installed.length === 0 ? "none" : installed.join(", ")}`)
  }

  // Drift, reported the same way `diff` reports it.
  const drift = collectDrift(ctx.cwd, manifest)
  lines.push("")
  if (drift.length === 0) {
    lines.push(ctx.paint.ok("✓ No drift between the manifest and the installed files."))
  } else {
    lines.push(ctx.paint.warn(`! ${drift.length} drifted file(s):`))
    for (const entry of drift) lines.push(`  ${entry.path} (${entry.state})`)
    lines.push("Run `santaka diff <component>` for the details.")
  }

  const registry = await loadRegistry(ctx.cwd)
  if (registry.rejected.length > 0) {
    lines.push("")
    lines.push(
      ctx.paint.warn(`! ${registry.rejected.length} registry entry/entries were rejected:`),
    )
    for (const entry of registry.rejected) {
      lines.push(`  ${entry.name}: ${entry.errors[0] ?? "invalid"}`)
    }
  }

  const problems = detection.problems.length + (error ? 1 : 0)
  return { code: problems === 0 ? EXIT.ok : EXIT.error, lines }
}

/**
 * `santaka diff <component>` — compare the manifest against the installed files.
 *
 * Exits `0` when clean and `2` when drifted, so it works as a CI check (§8).
 */
export async function diff(ctx: CommandContext, name: string | undefined): Promise<CommandResult> {
  const lines: string[] = []
  const { manifest, error } = readManifest(ctx.cwd)
  if (error) {
    lines.push(ctx.paint.error(`✖ ${error}`))
    return { code: EXIT.error, lines }
  }

  const ids = name ? [name] : Object.keys(manifest.items)
  if (ids.length === 0) {
    lines.push(ctx.paint.dim("Nothing is recorded in the manifest."))
    return { code: EXIT.ok, lines }
  }

  let drifted = false
  for (const id of ids) {
    const item = manifest.items[id]
    if (!item) {
      lines.push(ctx.paint.error(`✖ ${id} is not installed.`))
      drifted = true
      continue
    }
    const comparisons = compareFiles(ctx.cwd, item)
    const changed = comparisons.filter((entry) => entry.state !== "clean")
    if (changed.length === 0) {
      lines.push(ctx.paint.ok(`✓ ${id} is clean`))
      continue
    }
    drifted = true
    lines.push(ctx.paint.warn(`! ${id} has drifted:`))
    for (const entry of changed) {
      lines.push(`  ${entry.path} — ${entry.state}`)
    }
  }

  return { code: drifted ? EXIT.conflict : EXIT.ok, lines }
}

/**
 * `santaka theme init` — write the theme entrypoint, which is the token import
 * contract plus a documented override surface (§6's theming contract).
 */
export async function themeInit(ctx: CommandContext): Promise<CommandResult> {
  const lines: string[] = []
  const path = join(ctx.cwd, "santaka-theme.css")
  const content = renderThemeEntrypoint()
  if (existsSync(path) && readFileSync(path, "utf8") === content) {
    lines.push(ctx.paint.dim(`· ${relativeTo(ctx.cwd, path)} already up to date`))
    return { code: EXIT.ok, lines }
  }
  if (ctx.dryRun) {
    lines.push(ctx.paint.dim(`[dry run] would write ${relativeTo(ctx.cwd, path)}`))
    return { code: EXIT.ok, lines }
  }
  applyWrites([{ destination: path, content, action: existsSync(path) ? "replace" : "create" }])
  lines.push(ctx.paint.ok(`✓ wrote ${relativeTo(ctx.cwd, path)}`))
  lines.push("")
  lines.push("Import it once, after the tokens and the component CSS.")
  return { code: EXIT.ok, lines }
}

export async function registryAdd(
  ctx: CommandContext,
  url: string | undefined,
): Promise<CommandResult> {
  const lines: string[] = []
  if (!url) {
    const config = readRegistryConfig(ctx.cwd)
    if (config.registries.length === 0) {
      lines.push(ctx.paint.dim("No remote registries configured."))
    } else {
      for (const entry of config.registries) lines.push(`  ${entry}`)
    }
    return { code: EXIT.ok, lines }
  }
  if (!/^https?:\/\//.test(url)) {
    lines.push(ctx.paint.error(`✖ "${url}" is not an http(s) URL.`))
    return { code: EXIT.error, lines }
  }

  // Fetch and validate before recording, so a broken URL is reported now rather
  // than at the next `add`.
  let itemCount = 0
  try {
    const remote = await fetchRemoteRegistry(url)
    itemCount = remote.items.length
    if (remote.rejected.length > 0) {
      lines.push(
        ctx.paint.warn(`! ${remote.rejected.length} entry/entries in the registry are invalid:`),
      )
      for (const entry of remote.rejected) {
        lines.push(`  ${entry.name}: ${entry.errors[0] ?? "invalid"}`)
      }
    }
  } catch (error) {
    lines.push(ctx.paint.error(`✖ ${error instanceof Error ? error.message : String(error)}`))
    return { code: EXIT.error, lines }
  }

  const config = readRegistryConfig(ctx.cwd)
  if (config.registries.includes(url)) {
    lines.push(ctx.paint.dim(`· ${url} is already registered`))
    return { code: EXIT.ok, lines }
  }
  config.registries.push(url)
  if (!ctx.dryRun) writeRegistryConfig(ctx.cwd, config)

  lines.push(ctx.paint.ok(`✓ registered ${url} (${itemCount} valid entries)`))
  lines.push("")
  lines.push(
    ctx.paint.warn(
      "! Registry content is untrusted until you have reviewed it. It is validated against the schema, which is not the same as reviewed.",
    ),
  )
  return { code: EXIT.ok, lines }
}

/**
 * `santaka update` — reinstall every recorded component.
 *
 * Delegates to `add` with the recorded names, so there is exactly one
 * implementation of the conflict rule. A separate update path is how the two
 * drift until one of them overwrites something.
 */
export async function update(ctx: CommandContext): Promise<CommandResult> {
  const { manifest } = readManifest(ctx.cwd)
  const ids = Object.keys(manifest.items)
  if (ids.length === 0) {
    return { code: EXIT.ok, lines: [ctx.paint.dim("Nothing is installed; nothing to update.")] }
  }
  const result = await add(ctx, { names: ids })
  return {
    code: result.code,
    lines: [ctx.paint.bold(`Updating ${ids.join(", ")}`), "", ...result.lines],
  }
}

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

function relativeTo(cwd: string, path: string): string {
  return path.replace(cwd, "").replace(/^[\\/]/, "")
}

function describeDetection(detection: Detection, ctx: CommandContext): string[] {
  const lines: string[] = []
  const framework = detection.framework ?? "(not detected)"
  lines.push(`Framework: ${ctx.paint.bold(framework)}`)
  for (const evidence of detection.frameworkEvidence) {
    lines.push(ctx.paint.dim(`  ← ${evidence}`))
  }
  lines.push(`Package manager: ${detection.packageManager ?? "(unknown)"}`)
  for (const evidence of detection.packageManagerEvidence) {
    lines.push(ctx.paint.dim(`  ← ${evidence}`))
  }
  lines.push(`TypeScript: ${detection.typescript ? "yes" : "no"}`)
  if (detection.configFiles.length > 0) {
    lines.push(`Config files: ${detection.configFiles.join(", ")}`)
  }
  if (detection.styling.length > 0) {
    lines.push(`Styling: ${detection.styling.join(", ")}`)
  }
  for (const problem of detection.problems) {
    lines.push(ctx.paint.error(`✖ ${problem}`))
  }
  return lines
}

function listNames(registry: LoadedRegistry, ctx: CommandContext): string[] {
  const lines: string[] = []
  const byStability = new Map<string, RegistryItem[]>()
  for (const item of registry.items) {
    const group = byStability.get(item.stability) ?? []
    group.push(item)
    byStability.set(item.stability, group)
  }
  for (const stability of ["stable", "preview", "experimental", "deprecated"]) {
    const group = byStability.get(stability)
    if (!group || group.length === 0) continue
    lines.push(ctx.paint.dim(`${stability}:`))
    for (const item of group.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(`  ${item.name.padEnd(16)} ${item.ai.summary}`)
    }
  }
  return lines
}

function collectDrift(cwd: string, manifest: Manifest) {
  const drift: Array<{ path: string; state: string }> = []
  for (const item of Object.values(manifest.items)) {
    for (const comparison of compareFiles(cwd, item)) {
      if (comparison.state !== "clean")
        drift.push({ path: comparison.path, state: comparison.state })
    }
  }
  return drift
}

function describeInstallCommands(
  packageManager: Detection["packageManager"],
  framework: string,
  ctx: CommandContext,
): string[] {
  const runner =
    packageManager === "pnpm"
      ? "pnpm add"
      : packageManager === "yarn"
        ? "yarn add"
        : packageManager === "bun"
          ? "bun add"
          : "npm install"
  const packages =
    framework === "react-vite" || framework === "nextjs"
      ? "@santaka-ui/react @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles"
      : "@santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles"

  return [
    ctx.paint.bold("Next:"),
    `  1. ${runner} ${packages}`,
    "  2. import the CSS once, at your app entry:",
    '       import "@santaka-ui/tokens/css"',
    '       import "@santaka-ui/styles/index.css"',
    framework === "react-vite" || framework === "nextjs"
      ? '       import "@santaka-ui/react/styles.css"'
      : '       import "@santaka-ui/web-components"',
    framework === "react-vite" || framework === "nextjs"
      ? ""
      : '       import "@santaka-ui/web-components/santaka.css"',
    "  3. npx santaka add button",
  ].filter((line) => line !== undefined)
}

/**
 * The theme entrypoint's contents: the token import contract plus the documented
 * override surface. Written rather than generated from the tokens package,
 * because it is a file the consumer is expected to edit.
 */
function renderThemeEntrypoint(): string {
  return `/*
 * Santaka UI — theme entrypoint.
 *
 * Import this once, after the token and component stylesheets. Everything here
 * is a CSS custom property, so overriding a value is the whole customization
 * contract (section 6): there is no build step, no theme object, and no
 * JavaScript.
 */

@import "@santaka-ui/tokens/css/light.css";
@import "@santaka-ui/tokens/css/dark.css";

/*
 * Dark theme is selected by an attribute, so it works with SSR and without
 * JavaScript — set data-sk-theme="dark" on any ancestor.
 *
 *   :root                     { light values }
 *   [data-sk-theme="dark"]    { dark values  }
 *
 * Override any token by redeclaring it after the imports:
 *
 *   :root {
 *     --sk-color-primary: oklch(0.62 0.19 260);
 *   }
 *
 * Direction comes from dir="rtl" on any ancestor. There is no RTL build and no
 * second stylesheet.
 */
`
}

export { SUPPORTED_FRAMEWORKS, emptyManifest, removeItem }
