/**
 * Token build (ADR-002).
 *
 * DTCG JSON is the source of truth. This script compiles it to CSS custom
 * properties for the light and dark themes, and fails loudly on:
 *
 *   - an unknown or circular token reference
 *   - a contrast pair below its documented target (section 4, error contract)
 *
 * Every color is emitted twice: a legacy rgb()/hex declaration first, then the
 * oklch() value, so Core-tier browsers (the browser support baseline) render the
 * intended color instead of inheriting the page color.
 *
 * The math lives in `token-pipeline.mjs` so it can be tested without running a
 * build. This file is only filesystem wiring.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  contrastRatio,
  flatten,
  hexToOklch,
  isColorLeaf,
  kebab,
  resolveAll,
} from "./token-pipeline.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const srcDir = join(pkgRoot, "src")
const outDir = join(pkgRoot, "dist", "css")

const THEMES = ["light", "dark"]

/**
 * Contrast pairs the build refuses to ship without. Targets are the WCAG
 * levels; section 6 of plan.md records the measured values in the token
 * descriptions themselves.
 */
const CONTRAST_GATES = [
  { token: "color.text", against: "color.surface", min: 4.5 },
  { token: "color.text-muted", against: "color.surface", min: 4.5 },
  { token: "color.border-strong", against: "color.surface", min: 3 },
  { token: "color.primary-fg", against: "color.primary", min: 4.5 },
  { token: "color.primary-fg", against: "color.primary-hover", min: 4.5 },
  { token: "color.primary-fg", against: "color.danger", min: 4.5 },
  { token: "color.primary-fg", against: "color.danger-hover", min: 4.5 },
  { token: "color.primary", against: "color.surface", min: 3 },
  { token: "color.focus-ring", against: "color.surface", min: 3 },
  { token: "color.danger", against: "color.surface", min: 3 },
  { token: "color.success", against: "color.surface", min: 3 },
  { token: "color.warning", against: "color.surface", min: 3 },
  // A hard offset shadow darkens whatever sits under it, so it can only be
  // gated against a light surface. In the dark theme the visible chrome stroke
  // is `color.border-strong`, gated above.
  { token: "color.shadow", against: "color.surface", min: 3, theme: "light" },
]

const read = (relativePath) => readFileSync(join(srcDir, relativePath), "utf8")

/**
 * Resolve one theme.
 *
 * Primitives live under `color.<ramp>` and semantic roles under `color.<role>`,
 * so their keys never collide. Dimensions are theme-independent except the glass
 * group, whose theme-dependent roles are declared in each theme file and merge
 * over the shared blur/saturate/fallback values.
 */
function buildTheme(theme) {
  const primitives = flatten(JSON.parse(read("color.primitives.json")))
  const dimensions = flatten(JSON.parse(read("dimensions.tokens.json")))
  const semantic = flatten(JSON.parse(read(join("themes", `${theme}.tokens.json`))))

  let resolved
  try {
    resolved = resolveAll({ ...primitives, ...dimensions, ...semantic })
  } catch (error) {
    throw new Error(`[tokens] ${theme}: ${error.message}`)
  }

  // Primitive ramps are internal; the semantic roles are the published contract.
  for (const path of Object.keys(primitives)) delete resolved[path]
  return { theme, flat: resolved }
}

function toCss({ theme, flat }) {
  const lines = [
    "/*",
    " * Santaka UI — generated theme stylesheet. DO NOT EDIT.",
    " *",
    " * Source: packages/tokens/src (DTCG), theme: " + theme,
    " * Regenerate with: pnpm --filter @santaka-ui/tokens build",
    " */",
    "",
  ]

  lines.push(theme === "light" ? ":root {" : '[data-sk-theme="dark"] {')
  lines.push(`  color-scheme: ${theme};`)

  const entries = Object.entries(flat).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  for (const [path, leaf] of entries) {
    const value = leaf.$value
    if (leaf.$description) lines.push(`  /* ${leaf.$description} */`)

    if (isColorLeaf(path, value)) {
      const oklch = hexToOklch(value)
      lines.push(`  --sk-${kebab(path)}: ${value};`)
      lines.push(`  @supports (color: ${oklch.css}) {`)
      lines.push(`    --sk-${kebab(path)}: ${oklch.css};`)
      lines.push("  }")
      continue
    }

    if (path.startsWith("shadow.")) {
      lines.push(`  --sk-${kebab(path)}: ${value};`)
      continue
    }

    // Typography tokens carry a size/line-height pair plus weight and tracking,
    // emitted as separate custom properties so a component can override one
    // without restating the rest.
    const extensions = leaf.$extensions
    if (extensions?.["sk.fontWeight"] || extensions?.["sk.letterSpacing"]) {
      const [size, lineHeight] = String(value)
        .split("/")
        .map((part) => part.trim())
      lines.push(`  --sk-${kebab(path)}-size: ${size};`)
      lines.push(`  --sk-${kebab(path)}-line-height: ${lineHeight};`)
      if (extensions["sk.fontWeight"]) {
        lines.push(`  --sk-${kebab(path)}-weight: ${extensions["sk.fontWeight"]};`)
      }
      if (extensions["sk.letterSpacing"]) {
        lines.push(`  --sk-${kebab(path)}-tracking: ${extensions["sk.letterSpacing"]};`)
      }
      continue
    }

    lines.push(`  --sk-${kebab(path)}: ${value};`)
  }

  lines.push("}")
  return lines.join("\n")
}

function main() {
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const built = THEMES.map(buildTheme)

  const failures = []
  const report = []
  for (const { theme, flat } of built) {
    for (const gate of CONTRAST_GATES) {
      if (gate.theme && gate.theme !== theme) continue
      const foreground = flat[gate.token]?.$value
      const background = flat[gate.against]?.$value
      if (!isColorLeaf(gate.token, foreground)) continue
      if (!isColorLeaf(gate.against, background)) continue

      const ratio = contrastRatio(foreground, background)
      const label = `${gate.token} on ${gate.against} (${theme})`
      report.push(`${ratio.toFixed(2)}:1 (min ${gate.min}:1)  ${label}`)

      // 0.005 of slack absorbs floating-point noise at an exact 4.5:1 boundary.
      if (ratio + 0.005 < gate.min) {
        failures.push(
          `[tokens] contrast FAIL: ${label} = ${ratio.toFixed(2)}:1, required ${gate.min}:1 ` +
            `(${foreground} on ${background})`,
        )
      }
    }
  }

  writeFileSync(join(outDir, "contrast-report.txt"), `${report.join("\n")}\n`)
  if (failures.length > 0) {
    for (const failure of failures) console.error(failure)
    throw new Error(`[tokens] ${failures.length} contrast gate(s) failed; nothing was written`)
  }

  for (const entry of built) {
    writeFileSync(join(outDir, `${entry.theme}.css`), `${toCss(entry)}\n`)
  }
  writeFileSync(
    join(outDir, "index.css"),
    '@charset "UTF-8";\n' +
      "/* Santaka UI — theme entrypoint. Import once in your application CSS. */\n" +
      '@import url("./light.css");\n@import url("./dark.css");\n',
  )

  console.log(
    `[tokens] built ${built.length} themes -> ${outDir} ` +
      `(${report.length} contrast pairs checked, all pass)`,
  )
}

main()
