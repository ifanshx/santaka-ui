/**
 * Bundle budget measurement (section 12 of plan.md, Performance budgets).
 *
 * The budgets are release gates: CI fails when one is exceeded. This script
 * bundles a fixture that imports the public entrypoint the way an application
 * would, minifies, gzips, and compares against the budget table.
 *
 * Two details make the number honest:
 *
 *  - The fixture *uses* what it imports. A bare `import "pkg"` measures
 *    nothing, because tree-shaking correctly deletes an unused import.
 *  - Each budget bundles only the named entrypoint, so a per-import figure
 *    measures import cost rather than package total.
 */
import { gzipSync } from "node:zlib"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const repoRoot = resolve(pkgRoot, "..", "..")

/**
 * Budgets from section 12. `uses` is the expression that keeps the import alive
 * through tree-shaking; without it the measurement is meaningless.
 */
const BUDGETS = [
  {
    name: "web-components runtime + Button",
    entry: join(pkgRoot, "dist/components/index.js"),
    uses: ["SkButton", "COMPONENTS"],
    budgetKb: 12,
  },
  {
    name: "component stylesheet (not gzipped into JS)",
    entry: join(pkgRoot, "dist/santaka.css"),
    raw: true,
    budgetKb: 4,
  },
  {
    name: "token themes, light + dark",
    entry: join(repoRoot, "packages/tokens/dist/css/light.css"),
    also: [join(repoRoot, "packages/tokens/dist/css/dark.css")],
    raw: true,
    budgetKb: 12,
  },
]

async function bundleOne(entryPath) {
  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    target: "es2022",
    legalComments: "none",
    loader: { ".css": "text" },
  })
  return result.outputFiles[0].contents
}

async function measure(budget) {
  const dir = mkdtempSync(join(tmpdir(), "sk-size-"))

  try {
    if (budget.raw) {
      // A stylesheet is shipped as a file, not bundled. Its size is what the
      // browser downloads, so measure the bytes as authored plus minified.
      const parts = [budget.entry, ...(budget.also ?? [])]
      let total = 0
      for (const part of parts) {
        const source = readFileSync(part, "utf8")
        const minified = await esbuild.transform(source, { loader: "css", minify: true })
        total += Buffer.byteLength(minified.code)
      }
      return { gzip: total }
    }

    const entryFile = join(dir, "entry.js")
    writeFileSync(
      entryFile,
      [
        `import { ${budget.uses.join(", ")} } from ${JSON.stringify(budget.entry)}`,
        // Reference every export so tree-shaking cannot delete the import.
        `export const used = [${budget.uses.join(", ")}]`,
      ].join("\n"),
    )

    const bytes = await bundleOne(entryFile)
    return { gzip: gzipSync(bytes).byteLength }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const failures = []
const rows = []

for (const budget of BUDGETS) {
  let gzip
  try {
    ;({ gzip } = await measure(budget))
  } catch (error) {
    failures.push(`[size] ${budget.name}: could not measure — ${error.message}`)
    continue
  }

  const kb = gzip / 1024
  rows.push({ name: budget.name, kb, budgetKb: budget.budgetKb })

  if (kb > budget.budgetKb) {
    failures.push(
      `[size] ${budget.name}: ${kb.toFixed(2)} KB exceeds the ${budget.budgetKb} KB budget ` +
        `(a regression needs a PR note or an ADR)`,
    )
  }
}

const width = Math.max(...rows.map((row) => row.name.length))
for (const row of rows) {
  const status = row.kb <= row.budgetKb ? "ok  " : "OVER"
  console.log(`${status} ${row.name.padEnd(width)}  ${row.kb.toFixed(2)} KB / ${row.budgetKb} KB`)
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}
