#!/usr/bin/env node
/**
 * Security scan (docs/ARCHITECTURE.md §16, "Dependency licenses and security scans are
 * reviewed").
 *
 * Runs `pnpm audit --json` and classifies every advisory by **reach**, because a
 * raw severity count is what makes a security report useless. A critical RCE in a
 * dependency of an example application and the same advisory in a dependency of a
 * published package are different obligations, and a report that only prints
 * "3 critical" makes them look identical.
 *
 * Reach is read from the audit's own dependency paths (`findings[].paths` — e.g.
 * `examples/nextjs > next@15.5.4 > postcss@8.4.31`), not guessed from a module
 * name. The first segment of a path is the workspace importer, so a path rooted at
 * `packages/<name>` is a small package's own dependency tree.
 *
 * Three reach classes:
 *
 *   - `published` — a **direct** dependency of a package in `packages/`. It is in
 *     the small package's own `dependencies`, so it ships. Fails at high or
 *     critical.
 *   - `transitive` — reachable through a published package's tree but not a direct
 *     dependency of it. It still ships — installing the package pulls it in — so
 *     it fails on the same threshold. This class is the whole point of reading the
 *     paths: an earlier version could not tell it apart from `dev`, so a
 *     vulnerability one level down from a shipped package looked like tooling.
 *   - `dev` — reachable only from this repository's tooling, examples, or the
 *     private docs app. It cannot reach a consumer, so it never fails. It is
 *     reported, because "40 advisories, all accounted for" is a different claim
 *     from "40 advisories, ignored".
 *
 * The current scan reports **no published or transitive advisories**: all 40 are
 * rooted at `examples/nextjs` (`next`, and `postcss`/`sharp` under it). That is
 * recorded rather than hidden, and the thresholds are stated so the next person
 * can tell what changed.
 *
 * Usage:
 *   node scripts/scan-security.mjs           # report; exit 1 if a shipped reach has high/critical
 *   node scripts/scan-security.mjs --strict  # fail on any shipped-reach advisory
 */
import { spawnSync } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..")

export const SEVERITY = ["info", "low", "moderate", "high", "critical"]

function existsPackage(dir) {
  try {
    return Boolean(readFileSync(join(dir, "package.json"), "utf8"))
  } catch {
    return false
  }
}

/** The directory names of every package under `packages/` — the published set. */
export function publishedDirNames(root) {
  return readdirSync(join(root, "packages")).filter((name) =>
    existsPackage(join(root, "packages", name)),
  )
}

/** The direct runtime dependencies of every published package, module -> owners. */
export function publishedDirectDeps(root) {
  const deps = new Map()
  for (const name of publishedDirNames(root)) {
    const manifest = JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8"))
    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      if (!deps.has(dep)) deps.set(dep, [])
      deps.get(dep).push(name)
    }
  }
  return deps
}

/**
 * The workspace importer at the root of an audit dependency path.
 *
 * The path separator is `>`; on Windows the importer itself uses `\`, so it is
 * normalised to `/` to match the lockfile's importer keys.
 */
export function importerRoot(depPath) {
  return depPath.split(">")[0].trim().replace(/\\/g, "/")
}

/** True when an importer root names a directory in `packages/`. */
function isPublishedRoot(importer, publishedDirs) {
  const match = /^packages\/([^/]+)$/.exec(importer)
  return match ? publishedDirs.has(match[1]) : false
}

/**
 * Classify one advisory by the reach of the audit's own dependency paths.
 *
 * `published` wins over `transitive` wins over `dev`: if an advisory can be
 * reached from a published package's tree, that is the obligation that matters,
 * even when the same module is also pulled in by an example.
 */
export function classifyAdvisory(advisory, { directDeps, publishedDirs }) {
  const module = advisory.module_name

  const roots = new Set()
  for (const finding of advisory.findings ?? []) {
    for (const path of finding.paths ?? []) roots.add(importerRoot(path))
  }
  const shippedRoots = [...roots].filter((root) => isPublishedRoot(root, publishedDirs))

  const owners = directDeps.get(module) ?? []
  const reach = owners.length > 0 ? "published" : shippedRoots.length > 0 ? "transitive" : "dev"

  return {
    module,
    severity: advisory.severity,
    title: advisory.title ?? "",
    reach,
    packages: owners,
    roots: [...roots].sort(),
  }
}

/**
 * Run `pnpm audit --json`.
 *
 * Two things this has to get right, both found the hard way:
 *
 *   - `pnpm` is a `.cmd` shim on Windows, so `shell: true` is required.
 *   - **The JSON lands on stderr, not stdout.** Reading stdout yields an empty
 *     string and a parse error, which looks like a broken audit rather than a
 *     misdirected read.
 */
function auditJson() {
  const result = spawnSync("pnpm", ["audit", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === "win32",
  })
  // pnpm exits non-zero when it finds anything; the report is still well-formed.
  return (result.stderr ?? "").trim() || (result.stdout ?? "").trim()
}

function main() {
  const strict = process.argv.includes("--strict")
  const failAt = strict ? 0 : 3 // index into SEVERITY: high

  const payload = auditJson()
  let report
  try {
    report = JSON.parse(payload)
  } catch {
    process.stdout.write(`[security] could not parse the pnpm audit report.\n`)
    process.stdout.write(`[security] first 400 characters: ${payload.slice(0, 400)}\n`)
    process.exit(1)
  }

  const directDeps = publishedDirectDeps(repoRoot)
  const publishedDirs = new Set(publishedDirNames(repoRoot))
  const advisories = Object.values(report.advisories ?? {})

  const rows = advisories
    .map((advisory) => classifyAdvisory(advisory, { directDeps, publishedDirs }))
    .sort((a, b) => {
      const byReach = a.reach.localeCompare(b.reach)
      if (byReach !== 0) return byReach
      return SEVERITY.indexOf(b.severity) - SEVERITY.indexOf(a.severity)
    })

  const write = (line) => process.stdout.write(`${line}\n`)

  const counts = report.metadata?.vulnerabilities ?? {}
  write(
    `[security] ${advisories.length} advisories — critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0}`,
  )
  write("")

  const shipped = rows.filter((row) => row.reach !== "dev")
  if (shipped.length === 0) {
    write("[security] none reach a package that ships to consumers.")
    write(
      "[security] every advisory is rooted in this repository's tooling or examples — see the breakdown below.",
    )
  } else {
    for (const row of rows.filter((r) => r.reach === "published")) {
      write(
        `  PUBLISHED  ${row.severity.toUpperCase().padEnd(8)} ${row.module} (${row.packages.join(", ")}) — ${row.title}`,
      )
    }
    for (const row of rows.filter((r) => r.reach === "transitive")) {
      write(
        `  TRANSITIVE ${row.severity.toUpperCase().padEnd(8)} ${row.module} — via ${row.roots.join(", ")}`,
      )
    }
  }
  write("")

  // Group the rest by module so the output is readable rather than a wall.
  const dev = rows.filter((row) => row.reach === "dev")
  const byModule = new Map()
  for (const row of dev) {
    if (!byModule.has(row.module)) byModule.set(row.module, [])
    byModule.get(row.module).push(row)
  }
  write("[security] advisories that cannot reach a consumer, by module:")
  for (const [module, entries] of [...byModule].sort((a, b) => b[1].length - a[1].length)) {
    const worst = entries
      .map((entry) => entry.severity)
      .sort((a, b) => SEVERITY.indexOf(b) - SEVERITY.indexOf(a))[0]
    const roots = [...new Set(entries.flatMap((entry) => entry.roots))].sort()
    write(
      `  ${worst.toUpperCase().padEnd(8)} ${module} — ${entries.length} advisory/advisories via ${roots.join(", ")}`,
    )
  }
  write("")

  const blocking = shipped.filter((row) => SEVERITY.indexOf(row.severity) >= failAt)
  if (blocking.length > 0) {
    write(
      `[security] ${blocking.length} advisory/advisories ship to consumers and block release (threshold: ${SEVERITY[failAt]}).`,
    )
    process.exit(1)
  }
  write("[security] no blocking advisory in a package or a transitive path that ships")
}

// Only run when invoked as a script, so the classifiers above can be imported by
// a test without executing `pnpm audit`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
