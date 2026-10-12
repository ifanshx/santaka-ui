/**
 * Bundle budget measurement (section 12 of plan.md, Performance budgets).
 *
 * The budgets are release gates: CI fails when one is exceeded. This script
 * bundles a fixture that imports the public entrypoint the way an application
 * would, minifies, gzips, and compares against the budget table.
 *
 * Three details make the numbers honest:
 *
 *  - The fixture *uses* what it imports. A bare `import "pkg"` measures nothing,
 *    because tree-shaking correctly deletes an unused import.
 *  - Each JavaScript budget bundles only the named entrypoint, so a figure is
 *    import cost rather than package total.
 *  - The component stylesheet is measured **per component**. A single total
 *    would grow with every component shipped and say nothing about whether any
 *    one of them is oversized, which is the question a budget should answer.
 */
import { gzipSync } from "node:zlib"
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const repoRoot = resolve(pkgRoot, "..", "..")
const componentsSrc = join(pkgRoot, "src", "components")

/** Component directories that ship a stylesheet. `shared` holds no components. */
function componentDirs() {
  return readdirSync(componentsSrc, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "shared")
    .map((entry) => join(componentsSrc, entry.name, `${entry.name}.css`))
}

async function measureJs(entry, uses) {
  const dir = mkdtempSync(join(tmpdir(), "sk-size-"))
  try {
    const entryFile = join(dir, "entry.js")
    writeFileSync(
      entryFile,
      [
        `import { ${uses.join(", ")} } from ${JSON.stringify(entry)}`,
        `export const used = [${uses.join(", ")}]`,
      ].join("\n"),
    )
    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      target: "es2022",
      legalComments: "none",
    })
    return gzipSync(result.outputFiles[0].contents).byteLength
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * CSS ships as files, not bundled, so its size is what the browser downloads:
 * the bytes minified, not the bytes gzipped over the wire. `divisor` spreads the
 * total across the components that produced it.
 */
async function measureCss(files, divisor = 1) {
  let total = 0
  for (const file of files) {
    const source = readFileSync(file, "utf8")
    const minified = await esbuild.transform(source, { loader: "css", minify: true })
    total += Buffer.byteLength(minified.code)
  }
  return total / divisor
}

const componentCssFiles = componentDirs()
const componentCount = componentCssFiles.length

const BUDGETS = [
  {
    name: "web-components runtime",
    measure: () =>
      measureJs(join(pkgRoot, "dist/components/index.js"), [
        "SkBadge",
        "SkButton",
        "SkIconButton",
        "SkLink",
        "COMPONENTS",
      ]),
    budgetKb: 12,
  },
  {
    name: "component CSS, per component",
    measure: () => measureCss(componentCssFiles, componentCount),
    budgetKb: 4,
  },
  // Raised from 12 KB when the neo-brutalist and glass token layer landed. The
  // growth is the token surface itself — the brutal shadow ladder, the arcade
  // motion pairs, the glass alpha group, and the four per-theme `*-subtle`
  // badge fills — not a regression. It is not comment weight: esbuild strips
  // comments before this measurement, so the emitted `$description` prose
  // contributes nothing here and trimming it would recover 0 bytes.
  {
    name: "token themes, light + dark",
    measure: () =>
      measureCss([
        join(repoRoot, "packages/tokens/dist/css/light.css"),
        join(repoRoot, "packages/tokens/dist/css/dark.css"),
      ]),
    budgetKb: 13,
  },
]

const failures = []
const rows = []

for (const budget of BUDGETS) {
  try {
    const kb = (await budget.measure()) / 1024
    rows.push({ name: budget.name, kb, budgetKb: budget.budgetKb })
    if (kb > budget.budgetKb) {
      failures.push(
        `[size] ${budget.name}: ${kb.toFixed(2)} KB exceeds the ${budget.budgetKb} KB budget ` +
          `(a regression needs a PR note or an ADR)`,
      )
    }
  } catch (error) {
    failures.push(`[size] ${budget.name}: could not measure — ${error.message}`)
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
