/**
 * Load the registry metadata the MCP tools answer from.
 *
 * Two data sources, both resolved through their package's public `exports`
 * (section 4's distribution contract), never by a relative path out of the
 * workspace. That matters for more than tidiness: a relative path works in the
 * monorepo and breaks in the published tarball, which is the exact defect the
 * exports contract exists to prevent. Using the exports map means the smoke test
 * and a real install exercise the same resolution.
 *
 *   - `@santaka-ui/core/registry` — the generated aggregate: every entry,
 *     already validated at build time by `@santaka-ui/core`.
 *   - `@santaka-ui/tokens/css/light.css` and `.../dark.css` — the compiled token
 *     contract, which is what `get_tokens` reports. Parsed rather than
 *     re-derived from the DTCG source, because the compiled CSS *is* the public
 *     contract (section 4).
 */
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import type { RegistryItem } from "@santaka-ui/core"

const require = createRequire(import.meta.url)

export type RegistryIndexFile = {
  schemaVersion: number
  generatedFrom: string[]
  items: RegistryItem[]
}

/** Every shipped component, in the order the index was generated. */
export function loadRegistry(): RegistryIndexFile {
  const path = require.resolve("@santaka-ui/core/registry")
  return JSON.parse(readFileSync(path, "utf8")) as RegistryIndexFile
}

export type TokenTheme = "light" | "dark"

export type Token = {
  name: string
  value: string
  /** The first segment after `--sk-`: `--sk-color-primary` → `color`. */
  group: string
}

/**
 * Parse a compiled theme stylesheet into its custom properties.
 *
 * A token may be emitted twice — a hex fallback then an `oklch()` value behind
 * `@supports`, so a Core-tier browser renders the intended color. The last
 * declaration wins, which is the same cascade the browser applies, so the value
 * reported is the one a Baseline browser would compute.
 */
export function loadTokens(theme: TokenTheme): Token[] {
  const path = require.resolve(`@santaka-ui/tokens/css/${theme}.css`)
  const css = readFileSync(path, "utf8")

  const byName = new Map<string, Token>()
  for (const match of css.matchAll(/^\s*(--sk-[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
    const name = match[1]
    const rawValue = match[2]
    // The regex has two capture groups, so both are present on a match; the
    // guard is what `noUncheckedIndexedAccess` requires, not a real case.
    if (name === undefined || rawValue === undefined) continue
    const value = rawValue.trim()
    byName.set(name, { name, value, group: name.replace(/^--sk-/, "").split("-")[0] ?? name })
  }
  return [...byName.values()]
}
