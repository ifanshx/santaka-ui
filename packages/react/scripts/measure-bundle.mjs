/**
 * Bundle budget for `@santaka-ui/react` (plan.md §12: runtime overhead ≤ 15 KB).
 *
 * This row was the last one in the budget table with no measurement. It is not
 * a formality: the React package is a thin wrapper, and the failure mode a
 * budget catches here is a wrapper that quietly pulls a second copy of something
 * — the web components, a utilities barrel, or a React runtime — into the
 * consumer's bundle.
 *
 * Two details make the figure mean what the row says:
 *
 *  - **"Overhead" excludes the component code and React itself.** `react`,
 *    `react-dom`, `@santaka-ui/web-components`, and `@santaka-ui/utilities` are
 *    external, because a consumer has them already. Counting them would measure
 *    the application, not this package.
 *  - **Every export is used, not a representative subset.** The list comes from
 *    `src/index.ts`, so a wrapper added later cannot go unmeasured — the same
 *    mistake that made the web-components row report 9.34 KB through three
 *    component additions (`.changeset/budget-measurement-honesty.md`).
 */
import { gzipSync } from "node:zlib"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")

const BUDGET_KB = 15

/** Peers and workspace packages a consumer already has. */
const EXTERNAL = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "@santaka-ui/web-components",
  "@santaka-ui/utilities",
]

/**
 * The wrapper components this package exports, read from the barrel. Type-only
 * re-exports are skipped: they cost nothing at runtime, so counting them would
 * inflate the fixture without measuring anything.
 */
function exportedComponents() {
  const source = readFileSync(join(pkgRoot, "src", "index.ts"), "utf8")
  const names = [...source.matchAll(/^export\s*\{\s*([^}]+)\}\s*from/gm)]
    .flatMap(([, list]) => list.split(","))
    .map((name) => name.trim())
    .filter((name) => name && !name.startsWith("type ") && /^[A-Z]/.test(name))
  if (names.length === 0) {
    throw new Error(
      "[react] no value exports found in src/index.ts. The budget would measure nothing, which is worse than having no budget.",
    )
  }
  return [...new Set(names)]
}

async function measure(names) {
  const dir = mkdtempSync(join(tmpdir(), "sk-react-"))
  try {
    const fixture = join(dir, "fixture.js")
    writeFileSync(
      fixture,
      `import { ${names.join(", ")} } from ${JSON.stringify(join(pkgRoot, "dist", "index.js"))}\n` +
        `export const used = [${names.join(", ")}]\n`,
    )
    const result = await esbuild.build({
      entryPoints: [fixture],
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      target: "es2022",
      legalComments: "none",
      external: EXTERNAL,
    })
    return gzipSync(result.outputFiles[0].contents).byteLength
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const names = exportedComponents()
const kb = (await measure(names)) / 1024
const status = kb <= BUDGET_KB ? "ok  " : "OVER"

console.log(
  `${status} react runtime overhead  ${kb.toFixed(2)} KB / ${BUDGET_KB} KB  (${names.length} wrappers, peers external)`,
)

if (kb > BUDGET_KB) {
  console.error(
    `[size] react runtime overhead: ${kb.toFixed(2)} KB exceeds the ${BUDGET_KB} KB budget ` +
      `(a regression needs a PR note or an ADR)`,
  )
  process.exit(1)
}
