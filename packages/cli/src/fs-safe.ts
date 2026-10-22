/**
 * Filesystem safety (docs/ARCHITECTURE.md §8 and §9's registry safety rules).
 *
 * Two rules govern everything here, and both exist because the alternative is a
 * CLI that can destroy a consumer's work:
 *
 *   1. **A registry entry is untrusted.** Its `files[].path` is a string from
 *      JSON that a third party wrote. It is resolved, normalized, and confirmed
 *      to stay inside the target directory before anything is written. A path
 *      like `../../.ssh/authorized_keys` is refused, not sanitized.
 *
 *   2. **A run either completes or leaves nothing behind.** Writes go through a
 *      journal: every file is backed up before it is replaced, and a failure
 *      replays the journal backwards. A half-installed component is worse than
 *      an uninstalled one, because the consumer cannot tell which half.
 *
 * Nothing here executes anything. Copying a file is the whole operation.
 */
import { createHash } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path"

export type PathSafetyResult =
  { ok: true; absolute: string; relative: string } | { ok: false; reason: string }

/**
 * Resolve a registry-declared path against the target directory, refusing
 * anything that escapes it.
 *
 * The check is `relative()` rather than a string prefix test, because a prefix
 * test on `"/project/sub".startsWith("/project")` accepts `/project-other`, and
 * one on `"/project"` accepts `"/project/../project-evil"`. Comparing the
 * relative path for a leading `..` or an absolute result is the only form that
 * is correct on both POSIX and Windows separators.
 */
export function resolveInside(targetDir: string, declaredPath: string): PathSafetyResult {
  if (declaredPath.trim().length === 0) {
    return { ok: false, reason: "empty path" }
  }
  if (declaredPath.includes("\0")) {
    return { ok: false, reason: "path contains a null byte" }
  }

  const base = resolve(targetDir)
  const absolute = normalize(isAbsolute(declaredPath) ? declaredPath : join(base, declaredPath))
  const rel = relative(base, absolute)

  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    return {
      ok: false,
      reason: `path "${declaredPath}" resolves outside the target directory`,
    }
  }
  // A path that lands on the target directory itself is not a file to write.
  if (rel.split(sep).includes("..")) {
    return { ok: false, reason: `path "${declaredPath}" contains a traversal segment` }
  }

  return { ok: true, absolute, relative: rel.split(sep).join("/") }
}

/** The sha256 of a file's bytes, in the registry's `sha256-<hex>` form. */
export function checksumOf(path: string): string {
  return `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`
}

export function checksumOfBytes(bytes: string | Buffer): string {
  return `sha256-${createHash("sha256").update(bytes).digest("hex")}`
}

/** A file the CLI intends to write, with what it would replace. */
export type WritePlanEntry = {
  /** Absolute destination. */
  destination: string
  /** Content to write. */
  content: string | Buffer
  /** `"create"` when nothing is there, `"replace"` when something is. */
  action: "create" | "replace"
}

export type WriteResult = {
  written: string[]
  /** Entries skipped because the file already had identical content. */
  unchanged: string[]
}

/**
 * Apply a set of writes, or apply none of them.
 *
 * Every existing destination is copied to a temporary sibling before being
 * replaced. If any write fails, the journal is replayed in reverse: replaced
 * files are restored from their backups, created files are removed, and
 * directories the run made are pruned. The caller sees the original error.
 *
 * This is deliberately not a `try { write } catch { unlink }` around each file.
 * A per-file rollback leaves the earlier files of the same run in place, which
 * is the half-installed state the rule exists to prevent.
 */
export function applyWrites(entries: WritePlanEntry[]): WriteResult {
  const written: string[] = []
  const unchanged: string[] = []
  const journal: Array<{ kind: "created" | "replaced"; path: string; backup?: string }> = []
  const createdDirs: string[] = []

  const ensureDir = (path: string) => {
    const dir = dirname(path)
    if (existsSync(dir)) return
    // Record every directory level the run creates, so rollback can prune them
    // without removing one that already existed.
    const missing: string[] = []
    let current = dir
    while (!existsSync(current) && dirname(current) !== current) {
      missing.push(current)
      current = dirname(current)
    }
    mkdirSync(dir, { recursive: true })
    createdDirs.push(...missing.reverse())
  }

  try {
    for (const entry of entries) {
      const incoming =
        typeof entry.content === "string" ? Buffer.from(entry.content) : entry.content

      if (existsSync(entry.destination) && statSync(entry.destination).isFile()) {
        const existing = readFileSync(entry.destination)
        if (existing.equals(incoming)) {
          unchanged.push(entry.destination)
          continue
        }
        ensureDir(entry.destination)
        const backup = `${entry.destination}.santaka-backup`
        copyFileSync(entry.destination, backup)
        journal.push({ kind: "replaced", path: entry.destination, backup })
        writeFileSync(entry.destination, incoming)
      } else {
        ensureDir(entry.destination)
        writeFileSync(entry.destination, incoming)
        journal.push({ kind: "created", path: entry.destination })
      }
      written.push(entry.destination)
    }
  } catch (error) {
    for (const record of [...journal].reverse()) {
      try {
        if (record.kind === "replaced" && record.backup) {
          renameSync(record.backup, record.path)
        } else {
          rmSync(record.path, { force: true })
        }
      } catch {
        // Rollback is best-effort by necessity: if the filesystem is refusing
        // writes, there is nothing left to try. The original error is what the
        // caller sees, and the backup file (if it survived) is the recovery.
      }
    }
    for (const dir of [...createdDirs].reverse()) {
      try {
        rmSync(dir, { recursive: false })
      } catch {
        // Not empty, or already gone: both mean the directory is in use.
      }
    }
    throw error
  }

  // Success: the backups are no longer needed.
  for (const record of journal) {
    if (record.backup) rmSync(record.backup, { force: true })
  }

  return { written, unchanged }
}
