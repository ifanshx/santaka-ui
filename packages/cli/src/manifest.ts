/**
 * The install manifest and the conflict rule (plan.md §8, "Source-mode upgrades
 * and conflicts"; the decision is recorded in ADR-009).
 *
 * Source mode copies files into a consumer's repo, so the CLI has to remember
 * what it wrote and whether the consumer has since edited it. The manifest is
 * that memory:
 *
 *   santaka-manifest.json  { "version": 1, "items": { "<id>": { "version", "files": { "<path>": "sha256-…" } } } }
 *
 * The rule the manifest exists to enforce: **a modified file is never
 * overwritten without consent.** The recorded hash is of the bytes the CLI
 * wrote, not of the registry's copy, because the question is "has the consumer
 * changed this since we wrote it", not "does this still match upstream".
 *
 * The manifest is the only file the CLI creates outside the directories it was
 * asked to write, and it is left untouched on any failure — so a failed run is
 * always safe to repeat.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { checksumOf } from "./fs-safe.js"

export const MANIFEST_FILENAME = "santaka-manifest.json"
export const MANIFEST_VERSION = 1

export type ManifestItem = {
  version: string
  files: Record<string, string>
}

export type Manifest = {
  version: number
  items: Record<string, ManifestItem>
}

export function emptyManifest(): Manifest {
  return { version: MANIFEST_VERSION, items: {} }
}

export function manifestPath(cwd: string): string {
  return join(cwd, MANIFEST_FILENAME)
}

/**
 * Read the manifest, or an empty one.
 *
 * A corrupt manifest is reported rather than silently replaced: it is the
 * consumer's only record of what the CLI wrote, and overwriting it would turn a
 * parse error into data loss.
 */
export function readManifest(cwd: string): { manifest: Manifest; error?: string } {
  const path = manifestPath(cwd)
  if (!existsSync(path)) return { manifest: emptyManifest() }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Manifest
    if (typeof parsed !== "object" || parsed === null || typeof parsed.items !== "object") {
      return { manifest: emptyManifest(), error: `${MANIFEST_FILENAME} is not a manifest object.` }
    }
    return { manifest: { version: parsed.version ?? MANIFEST_VERSION, items: parsed.items } }
  } catch (error) {
    return {
      manifest: emptyManifest(),
      error: `${MANIFEST_FILENAME} could not be parsed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }
  }
}

export function writeManifest(cwd: string, manifest: Manifest): void {
  writeFileSync(manifestPath(cwd), `${JSON.stringify(manifest, null, 2)}\n`)
}

export type FileState = "clean" | "modified" | "missing" | "untracked"

export type FileComparison = {
  /** Path relative to the project root, as recorded. */
  path: string
  state: FileState
  /** The hash recorded when the CLI wrote it, if any. */
  recorded?: string
  /** The hash on disk now, if the file is there. */
  actual?: string
}

/**
 * Compare the manifest against the files on disk.
 *
 * Four states, and the distinction between them is the whole conflict model:
 *
 *   - `clean`     — on disk, and its bytes match what the CLI wrote. Safe to
 *                   replace.
 *   - `modified`  — on disk, but the consumer changed it. **Never** replaced
 *                   without consent.
 *   - `missing`   — recorded but gone. The consumer deleted it; recreating it
 *                   silently would undo a deliberate action.
 *   - `untracked` — the manifest has no record of it. Either it predates the
 *                   manifest or something else wrote it.
 */
export function compareFiles(cwd: string, item: ManifestItem): FileComparison[] {
  return Object.entries(item.files).map(([path, recorded]) => {
    const absolute = join(cwd, path)
    if (!existsSync(absolute)) {
      return { path, state: "missing" as const, recorded }
    }
    const actual = checksumOf(absolute)
    return {
      path,
      state: actual === recorded ? ("clean" as const) : ("modified" as const),
      recorded,
      actual,
    }
  })
}

/** The files a run must not touch without `--overwrite`. */
export function conflictsOf(comparisons: FileComparison[]): FileComparison[] {
  return comparisons.filter((entry) => entry.state === "modified")
}

/** Record what was written, so the next run can tell whether it changed. */
export function recordItem(
  manifest: Manifest,
  id: string,
  version: string,
  files: Array<{ path: string; absolute: string }>,
): Manifest {
  const hashes: Record<string, string> = {}
  for (const file of files) {
    hashes[file.path] = checksumOf(file.absolute)
  }
  return {
    ...manifest,
    version: MANIFEST_VERSION,
    items: { ...manifest.items, [id]: { version, files: hashes } },
  }
}

export function removeItem(manifest: Manifest, id: string): Manifest {
  const items = { ...manifest.items }
  delete items[id]
  return { ...manifest, version: MANIFEST_VERSION, items }
}
