// @ts-check
import { dirname, join } from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import { defineConfig } from "astro/config"

/**
 * Santaka UI documentation site (ADR-006).
 *
 * Static by default: every page is built from the registry, and only preview
 * islands hydrate. `output: "static"` is stated rather than left implicit,
 * because the decision it encodes — no server, no runtime — is the one ADR-006
 * makes.
 *
 * `publicDir` is the repository's existing `public/`, which the core build
 * already writes `llms.txt`, `llms-full.txt`, and `registry/` into. Those files
 * are served as-is; nothing here copies or regenerates them, so the payload an
 * agent reads and the payload the CLI fetches are literally the same bytes.
 */
export default defineConfig({
  site: "https://santaka.my.id",
  output: "static",
  publicDir: "./public",
  build: {
    // Inline nothing: the component CSS is external and cached.
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  vite: {
    // `postcss-import` resolves `@import` as a path, not as a package, so a bare
    // specifier inside a stylesheet fails with ENOENT. These aliases make the
    // bundled-CSS import in `src/styles/global.css` resolve to the packages'
    // exported files — and therefore through their exports map, which is the
    // contract (ADR-012) rather than a path that could drift.
    resolve: {
      alias: {
        "@santaka-ui/tokens/css": resolvePackage(
          "@santaka-ui/tokens/package.json",
          "dist/css/index.css",
        ),
        "@santaka-ui/web-components/santaka.css": resolvePackage(
          "@santaka-ui/web-components/package.json",
          "dist/santaka.css",
        ),
        "@santaka-ui/styles/index.css": resolvePackage(
          "@santaka-ui/styles/package.json",
          "dist/index.css",
        ),
      },
    },
  },
})

/**
 * Resolve a file inside a workspace package, so the docs site imports the
 * package's exported artifact rather than a hardcoded relative path out of
 * `node_modules`.
 *
 * @param {string} packageJson
 * @param {string} relative
 */
function resolvePackage(packageJson, relative) {
  const packageRoot = dirname(createRequire(import.meta.url).resolve(packageJson))
  return pathToFileURL(join(packageRoot, relative)).href
}
