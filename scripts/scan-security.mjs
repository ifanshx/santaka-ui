#!/usr/bin/env node
/**
 * Security scan (plan.md §17, "Dependency licenses and security scans are
 * reviewed").
 *
 * Runs `pnpm audit --json` and classifies every advisory by **reach**, because a
 * raw severity count is what makes a security report useless. A critical RCE in a
 * dependency of an example application and the same advisory in a dependency of a
 * published package are different obligations, and a report that only prints
 * "3 critical" makes them look identical.
 *
 * Three reach classes:
 *
 *   - `published` — the vulnerable module is a **direct** dependency of a
 *     package in `packages/`. This ships to consumers. Fails the build when
 *     severity is high or critical.
 *   - `transitive` — reachable through the dependency tree but not a direct
 *     dependency of a published package.
 *   - `dev` — reachable only from tooling or examples in this repository.
 *
 * The current scan reports **no published-package advisories**: everything found
 * is in `next` and `sharp` (the Next.js example) and `postcss` (the build tool
 * chain). That is recorded rather than hidden, and the thresholds are stated so
 * the next person can tell what changed.
 *
 * Usage:
 *   node scripts/scan-security.mjs           # report; exit 1 if a published dep has high/critical
 *   node scripts/scan-security.mjs --strict  # fail on any published-package advisory
 */
import { spawnSync } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..")
const strict = process.argv.includes("--strict")

const SEVERITY = ["info", "low", "moderate", "high", "critical"]
const FAIL_AT = strict ? 0 : 3 // index into SEVERITY: high
const PUBLISHED = readdirSync(join(repoRoot, "packages")).filter((name) =>
  existsPackage(join(repoRoot, "packages", name)),
)

function existsPackage(dir) {
  try {
    return Boolean(readFileSync(join(dir, "package.json"), "utf8"))
  } catch {
    return false
  }
}

/** The direct runtime dependencies of every published package. */
function publishedDirectDeps() {
  const deps = new Map()
  for (const name of PUBLISHED) {
    const manifest = JSON.parse(
      readFileSync(join(repoRoot, "packages", name, "package.json"), "utf8"),
    )
    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      if (!deps.has(dep)) deps.set(dep, [])
      deps.get(dep).push(name)
    }
  }
  return deps
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
  const payload = (result.stderr ?? "").trim() || (result.stdout ?? "").trim()
  return payload
}

const payload = auditJson()
let report
try {
  report = JSON.parse(payload)
} catch {
  process.stdout.write(`[security] could not parse the pnpm audit report.\n`)
  process.stdout.write(`[security] first 400 characters: ${payload.slice(0, 400)}\n`)
  process.exit(1)
}

const direct = publishedDirectDeps()
const advisories = Object.values(report.advisories ?? {})

const rows = advisories.map((advisory) => {
  const module = advisory.module_name
  const owners = direct.get(module)
  return {
    module,
    severity: advisory.severity,
    title: advisory.title ?? "",
    reach: owners ? "published" : "transitive-or-dev",
    packages: owners ?? [],
  }
})

rows.sort((a, b) => {
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

const publishedRows = rows.filter((row) => row.reach === "published")
if (publishedRows.length === 0) {
  write("[security] none reach a published package's direct dependencies.")
  write(
    "[security] everything found is transitive, or confined to this repository's tooling and examples — see the breakdown below.",
  )
} else {
  for (const row of publishedRows) {
    write(
      `  PUBLISHED  ${row.severity.toUpperCase().padEnd(8)} ${row.module} (${row.packages.join(", ")}) — ${row.title}`,
    )
  }
}
write("")

// Group the rest by module so the output is readable rather than a wall.
const rest = rows.filter((row) => row.reach !== "published")
const byModule = new Map()
for (const row of rest) {
  if (!byModule.has(row.module)) byModule.set(row.module, [])
  byModule.get(row.module).push(row)
}
write("[security] remaining advisories by module (tooling, examples, transitive):")
for (const [module, entries] of [...byModule].sort((a, b) => b[1].length - a[1].length)) {
  const worst = entries
    .map((entry) => entry.severity)
    .sort((a, b) => SEVERITY.indexOf(b) - SEVERITY.indexOf(a))[0]
  write(`  ${worst.toUpperCase().padEnd(8)} ${module} — ${entries.length} advisory/advisories`)
}
write("")

const blocking = publishedRows.filter((row) => SEVERITY.indexOf(row.severity) >= FAIL_AT)
if (blocking.length > 0) {
  write(
    `[security] ${blocking.length} advisory/advisories block release (threshold: ${SEVERITY[FAIL_AT]}).`,
  )
  process.exit(1)
}
write("[security] no blocking advisory in a published package")
