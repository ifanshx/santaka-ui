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

/** Find an item by name across the bundled registry and any configured remotes. */
export function findItem(registry: LoadedRegistry, name: string): RegistryItem | undefined {
  const normalized = name.trim().replace(/^sk-/, "").toLowerCase()
  return registry.items.find((item) => item.name === normalized)
}
