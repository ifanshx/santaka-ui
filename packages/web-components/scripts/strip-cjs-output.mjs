/**
 * Remove the CommonJS output Stencil emits unconditionally.
 *
 * plan.md §4 mandates ESM only: "No CommonJS build is emitted. Dual-format
 * output doubles the CI matrix and the exports surface while serving no consumer
 * that a modern bundler or Node 22 cannot reach."
 *
 * Stencil's `dist` output target has no option to suppress this — `OutputTargetDist`
 * accepts no `generateCjs` flag, and passing one is silently ignored rather than
 * rejected, which is why the first attempt at disabling it appeared to work and
 * then did not. So the files are removed after the build instead.
 *
 * This matters more than it looks. The CommonJS output was *unreachable*: the
 * package's `exports` map names only the ESM entrypoints, so no consumer could
 * import any of it. That is precisely why it was never noticed — 358 KB of dead
 * weight in every published tarball, invisible to the exports map, invisible to
 * the runtime budget (which measures what a consumer imports), and invisible to
 * `publint`.
 *
 * The ESM build is verified afterwards by `attw --pack`, so deleting the wrong
 * file fails the package gate rather than shipping a broken package.
 */
import { existsSync, rmSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")

/**
 * Paths Stencil emits that must not ship. The loader's `.cjs.js` is included
 * because `esmLoaderPath` writes both formats side by side.
 */
const CJS_PATHS = [
  join(pkgRoot, "dist", "cjs"),
  join(pkgRoot, "dist", "index.cjs.js"),
  join(pkgRoot, "dist", "index.cjs.js.map"),
  join(pkgRoot, "loader", "index.cjs.js"),
  join(pkgRoot, "loader", "index.cjs.js.map"),
]

/**
 * The ESM entrypoints that must survive. Checked rather than assumed, so a
 * Stencil upgrade that renames one fails the build loudly instead of shipping a
 * package whose entrypoint no longer exists.
 */
const REQUIRED_ESM = [
  join(pkgRoot, "dist", "components", "index.js"),
  join(pkgRoot, "dist", "components", "index.d.ts"),
  join(pkgRoot, "loader", "index.js"),
  join(pkgRoot, "loader", "index.d.ts"),
]

let removed = 0
for (const path of CJS_PATHS) {
  if (!existsSync(path)) continue
  rmSync(path, { recursive: true, force: true })
  removed += 1
}

const missing = REQUIRED_ESM.filter((path) => !existsSync(path))
if (missing.length > 0) {
  throw new Error(
    `[web-components] stripping CommonJS would ship a broken package; these ESM entrypoints are missing:\n${missing
      .map((f) => `  ${f}`)
      .join("\n")}`,
  )
}

console.log(`[web-components] stripped ${removed} CommonJS output path(s); ESM entrypoints intact`)
