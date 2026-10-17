/**
 * Registry resolution and source-file lookup (plan.md §8 and §9).
 *
 * Two registries are supported, and the distinction is a trust boundary rather
 * than a feature:
 *
 *   - **Bundled** — the entries that ship inside `@santaka-ui/core`. Reviewed,
 *     checksummed, and validated at build time.
 *   - **Remote** — a URL a consumer names with `santaka registry add`. Untrusted
 *     until the developer installing from it has read what it does. It is
 *     validated against the same schema, which is what keeps "untrusted" from
 *     meaning "unchecked", but validation is not review.
 *
 * Nothing in this module executes registry content. A remote entry supplies
 * metadata and file bytes; those bytes are written, never run.
 */
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { createRequire } from "node:module"
import { validateRegistryItem, type RegistryItem } from "@santaka-ui/core"
import { resolveInside } from "./fs-safe.js"

const require = createRequire(import.meta.url)

export type RegistrySource = {
  /** `bundled` for the shipped entries, otherwise the URL as given. */
  name: string
  url: string | null
}

export type LoadedRegistry = {
  items: RegistryItem[]
  sources: RegistrySource[]
  /** Entries that failed validation, so a caller can report rather than ignore. */
  rejected: Array<{ name: string; errors: string[] }>
}

/** The bundled registry: the entries published inside `@santaka-ui/core`. */
export function loadBundledRegistry(): LoadedRegistry {
  const path = require.resolve("@santaka-ui/core/registry")
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { items: RegistryItem[] }
  return { items: parsed.items, sources: [{ name: "bundled", url: null }], rejected: [] }
}

/**
 * The root of the published `@santaka-ui/web-components` package.
 *
 * The registry's `files[].path` values are written relative to this root
 * (`src/components/sk-button/sk-button.tsx`), so resolving them needs the root
 * and not the `src/components` directory. The package publishes `src/components`
 * precisely so source mode works outside the monorepo (ADR-012's distribution
 * contract); resolving through the package rather than a path out of this
 * repository is what makes the published tarball and this workspace take the
 * same path.
 */
export function componentSourceDir(): string {
  return dirname(require.resolve("@santaka-ui/web-components/package.json"))
}

export type ResolvedFile = {
  /** Path as the registry declares it, e.g. `src/components/sk-button/sk-button.tsx`. */
  declaredPath: string
  /** Absolute path of the source file to copy. */
  source: string
  /** Destination relative to the project root. */
  destination: string
  checksum: string
}

export type ResolveOutcome = { ok: true; files: ResolvedFile[] } | { ok: false; reason: string }

/**
 * Resolve a registry entry's files to a copy plan.
 *
 * Two independent checks, because they catch different failures:
 *
 *   1. The **destination** path is resolved inside the project root. A remote
 *      entry could name `../../.ssh/authorized_keys`; that is refused here.
 *   2. The **source** file's bytes are hashed and compared with the entry's
 *      declared checksum. A mismatch means the published file is not the file
 *      the entry describes — a tampered registry, or a stale entry — and the
 *      install stops rather than writing bytes nobody vouched for.
 */
export function resolveItemFiles(
  item: RegistryItem,
  targetDir: string,
  options: { verifyChecksums?: boolean } = {},
): ResolveOutcome {
  const sourceRoot = componentSourceDir()
  const files: ResolvedFile[] = []

  for (const declared of item.files) {
    const safety = resolveInside(targetDir, declared.path)
    if (!safety.ok) {
      return { ok: false, reason: `${item.name}: ${safety.reason}` }
    }

    // The declared path is relative to the published package root, so the
    // source is the declared path mirrored under that root. Mirrored rather than
    // reconstructed: a second naming rule here would drift from the one the
    // registry generator uses.
    const source = resolveInside(sourceRoot, declared.path)
    if (!source.ok) {
      return { ok: false, reason: `${item.name}: ${source.reason}` }
    }
    if (!existsSync(source.absolute)) {
      return {
        ok: false,
        reason: `${item.name}: source file ${declared.path} is not present in the published package`,
      }
    }

    if (options.verifyChecksums !== false) {
      const actual = checksumOfFile(source.absolute)
      if (actual !== declared.checksum) {
        return {
          ok: false,
          reason: `${item.name}: checksum mismatch for ${declared.path} — the published file is not the one the entry describes`,
        }
      }
    }

    files.push({
      declaredPath: declared.path,
      source: source.absolute,
      destination: safety.relative,
      checksum: declared.checksum,
    })
  }

  return { ok: true, files }
}

function checksumOfFile(path: string): string {
  return `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`
}

export type RemoteRegistryConfig = {
  version: number
  registries: string[]
}

const CONFIG_FILENAME = "santaka-registries.json"

export function readRegistryConfig(cwd: string): RemoteRegistryConfig {
  const path = join(cwd, CONFIG_FILENAME)
  if (!existsSync(path)) return { version: 1, registries: [] }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as RemoteRegistryConfig
    return { version: parsed.version ?? 1, registries: parsed.registries ?? [] }
  } catch {
    return { version: 1, registries: [] }
  }
}

export function writeRegistryConfig(cwd: string, config: RemoteRegistryConfig): void {
  writeFileSync(join(cwd, CONFIG_FILENAME), `${JSON.stringify(config, null, 2)}\n`)
}

/**
 * Fetch a remote registry index and validate every entry.
 *
 * Validation is not review, and the distinction matters enough to state in the
 * code: an entry that passes the schema is *well-formed*, not *trusted*. The
 * caller prints the source URL before writing anything, so the developer knows
 * which third party they are about to install from.
 *
 * No entry's own code is executed at any point — there is no field in the schema
 * that names a script, and this function only ever reads JSON.
 */
export async function fetchRemoteRegistry(url: string): Promise<LoadedRegistry> {
  const response = await fetch(url, { headers: { accept: "application/json" } })
  if (!response.ok) {
    throw new Error(`registry ${url} returned ${response.status} ${response.statusText}`)
  }
  const payload = (await response.json()) as { items?: unknown[] }
  const rawItems = Array.isArray(payload.items) ? payload.items : []
  const items: RegistryItem[] = []
  const rejected: Array<{ name: string; errors: string[] }> = []

  for (const raw of rawItems) {
    const outcome = validateRegistryItem(raw)
    if (outcome.ok) {
      items.push(outcome.item)
    } else {
      const name =
        typeof raw === "object" && raw !== null && "name" in raw
          ? String((raw as { name: unknown }).name)
          : "(unnamed)"
      rejected.push({ name, errors: outcome.errors.map((e) => `${e.pointer} ${e.message}`) })
    }
  }

  return { items, sources: [{ name: url, url }], rejected }
}

/**
 * The `N components, M blocks` line: counts by item type, derived from the
 * entries rather than from a list of type names, so an entry whose type is
 * unexpected is still counted and shown (ADR-022 §4) rather than silently
 * dropped from the total. Order follows first appearance, which is the order
 * the registry source emits.
 */
export function typeCounts(items: Array<Pick<RegistryItem, "type">>): string {
  const byType = new Map<string, number>()
  for (const item of items) {
    byType.set(item.type, (byType.get(item.type) ?? 0) + 1)
  }
  return [...byType.entries()]
    .map(([type, count]) => `${count} ${type}${count === 1 ? "" : "s"}`)
    .join(", ")
}

/** Find an item by name across the bundled registry and any configured remotes. */
export function findItem(registry: LoadedRegistry, name: string): RegistryItem | undefined {
  const normalized = name.trim().replace(/^sk-/, "").toLowerCase()
  return registry.items.find((item) => item.name === normalized)
}

export type ClosureResult =
  | { ok: true; items: RegistryItem[]; missing: MissingDependency[] }
  | { ok: false; reason: string; missing: MissingDependency[] }

/** A `registryDependencies` entry that does not resolve, with who asked for it. */
export type MissingDependency = { name: string; requestedBy: string }

/**
 * Walk the named items' `registryDependencies` depth-first and return the whole
 * install plan: dependencies first, then the named items themselves.
 *
 * Deduplication is by entry name, so a diamond (a→b,c→d) lists `d` once, and a
 * dependency already named on the command line is not installed twice. A cycle
 * is refused rather than recursed: `registryDependencies` is data from a
 * registry, which is untrusted until reviewed (§9's registry safety rules), so
 * a self-referential or mutual entry is an error the consumer sees, not a hang.
 *
 * The order below is the write order `add` uses: every dependency appears
 * before the item that declares it. With no `registryDependencies` anywhere —
 * the state of all shipped components — the plan is the named items alone.
 */
export function resolveClosure(registry: LoadedRegistry, roots: RegistryItem[]): ClosureResult {
  const missing: MissingDependency[] = []
  // `"visiting"` marks an item on the current DFS chain; `"done"` marks one
  // already placed in the plan. A `"visiting"` hit is therefore a cycle, and the
  // chain is what the error names.
  const states: Record<string, "visiting" | "done"> = {}
  const ordered: RegistryItem[] = []

  for (const root of roots) {
    const cycle = walkClosure(registry, root, states, ordered, missing, [])
    if (cycle !== null) {
      return { ok: false, reason: cycle, missing }
    }
  }

  return { ok: true, items: ordered, missing }
}

/**
 * One depth-first visit. Returns the cycle description when one is found, so
 * `resolveClosure` can fail with *the chain*, not a bare "recursion happened".
 */
function walkClosure(
  registry: LoadedRegistry,
  item: RegistryItem,
  states: Record<string, "visiting" | "done">,
  ordered: RegistryItem[],
  missing: MissingDependency[],
  chain: string[],
): string | null {
  const state = states[item.name]
  if (state === "done") return null
  if (state === "visiting") {
    return [...chain.slice(chain.indexOf(item.name)), item.name].join(" → ")
  }
  states[item.name] = "visiting"
  for (const dependency of item.registryDependencies) {
    const next = findItem(registry, dependency)
    if (!next) {
      missing.push({ name: dependency, requestedBy: item.name })
      continue
    }
    const cycle = walkClosure(registry, next, states, ordered, missing, [...chain, item.name])
    if (cycle !== null) return cycle
  }
  states[item.name] = "done"
  ordered.push(item)
  return null
}
