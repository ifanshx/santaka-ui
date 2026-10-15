/**
 * Copy build artifacts that tsc cannot emit.
 *
 * The component stylesheet: the Vue adapter renders the same custom elements as
 * the universal package, so it ships the same stylesheet rather than a second
 * copy authored for Vue. One source of truth means a CSS fix cannot land in one
 * path and miss the other — the same reason `@santaka-ui/react` does this.
 *
 * Unlike the React package there is no JSX intrinsic declaration to copy: this
 * adapter builds elements with Vue's `h()` taking a string tag, so there is no
 * `JSX.IntrinsicElements` for a consumer to extend.
 */
import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const source = resolve(pkgRoot, "..", "web-components", "dist", "santaka.css")
const target = join(pkgRoot, "dist", "styles.css")

mkdirSync(dirname(target), { recursive: true })

try {
  copyFileSync(source, target)
} catch (error) {
  throw new Error(
    `[vue] @santaka-ui/web-components has not been built. Run: pnpm --filter @santaka-ui/web-components build\n${error}`,
  )
}

console.log(`[vue] copied component styles -> ${target}`)
