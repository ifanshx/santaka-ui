/**
 * Copy the component stylesheet into the React package's dist.
 *
 * The React adapter renders the same custom elements as the universal package,
 * so it ships the same stylesheet rather than a second copy authored for React.
 * One source of truth means a CSS fix cannot land in one path and miss the
 * other.
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
    `[react] @santaka-ui/web-components has not been built. Run: pnpm --filter @santaka-ui/web-components build\n${error}`,
  )
}

console.log(`[react] copied component styles -> ${target}`)
