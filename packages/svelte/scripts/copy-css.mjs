/**
 * Copy build artifacts that tsc cannot emit.
 *
 * Two files, for the same reason: `tsc` compiles the source and emits
 * declarations for it, but a hand-written `.d.ts` that is part of the program is
 * not copied to `outDir` — the build would ship an `exports` entry pointing at a
 * file that does not exist. `@santaka-ui/react` has the same problem with its
 * `JSX.IntrinsicElements` declarations and solves it the same way.
 *
 *   - `santaka.css` — the stylesheet that belongs to the elements this package
 *     types. Copied from the universal package's build rather than authored
 *     here, so one source of truth means a CSS fix cannot land in one path and
 *     miss the other.
 *   - `custom-elements.d.ts` — the Svelte element and attribute types plus the
 *     `svelte/elements` module augmentation, exported as
 *     `@santaka-ui/svelte/elements`.
 */
import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const distDir = join(pkgRoot, "dist")

mkdirSync(distDir, { recursive: true })

const copies = [
  {
    source: resolve(pkgRoot, "..", "web-components", "dist", "santaka.css"),
    target: join(distDir, "styles.css"),
    what: "component styles",
    missing:
      "@santaka-ui/web-components has not been built. Run: pnpm --filter @santaka-ui/web-components build",
  },
  {
    source: join(pkgRoot, "src", "custom-elements.d.ts"),
    target: join(distDir, "custom-elements.d.ts"),
    what: "element type declarations",
    missing: "src/custom-elements.d.ts is missing from the package source",
  },
]

for (const { source, target, what, missing } of copies) {
  try {
    copyFileSync(source, target)
  } catch (error) {
    throw new Error(`[svelte] could not copy ${what}: ${missing}\n${error}`)
  }
  console.log(`[svelte] copied ${what} -> ${target}`)
}
