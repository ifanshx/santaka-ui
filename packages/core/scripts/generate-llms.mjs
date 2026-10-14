#!/usr/bin/env node
/**
 * Generate `llms.txt` and `llms-full.txt` (plan.md §11, AI metadata).
 *
 * §11 asks for two files with different jobs:
 *
 *   - `llms.txt` — a curated index: what the system is, the token contract, and
 *     the component list with one-line summaries. Short, for an agent deciding
 *     whether this library is relevant before reading anything long.
 *   - `llms-full.txt` — the full reference in one file: every component's props,
 *     variants, accessibility notes, and example.
 *
 * Both are derived from data the repository already treats as its source of
 * truth, so neither can drift from the components:
 *
 *   - `packages/core/registry/*.json` — the `ai` block: summary, whenToUse,
 *     whenNotToUse, accessibility, example, knownLimitations, localesCovered.
 *   - `packages/web-components/src/components.d.ts` — the props, read from the
 *     committed declaration file rather than from `dist/`, so the generator runs
 *     on a clean checkout with no build.
 *
 * The prose sections (`llms.txt`'s opening and the token contract) are authored
 * here rather than generated, because they describe the library as a whole and
 * there is no machine-readable source for "what the system is". Everything that
 * *can* be derived is, and `--check` fails when the committed files differ from
 * what this script would write — §11's "generated-and-verified ... so it can
 * never go stale".
 *
 * Usage:
 *   node scripts/generate-llms.mjs           # write both files
 *   node scripts/generate-llms.mjs --stdout  # print both to stdout
 *   node scripts/generate-llms.mjs --check   # exit 1 if either file drifts
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { propsFor, readComponentTypes } from "./lib/component-types.mjs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const coreRoot = resolve(here, "..")
const repoRoot = resolve(coreRoot, "..", "..")

const REGISTRY_DIR = join(coreRoot, "registry")
const TYPES_FILE = join(repoRoot, "packages", "web-components", "src", "components.d.ts")
const OUT_DIR = join(repoRoot, "apps", "docs", "public")

/** Stable before Preview before Experimental — §11's ordering rule. */
const STABILITY_ORDER = { stable: 0, preview: 1, experimental: 2 }

/**
 * Read the registry entries, sorted by stability then name, so the output is
 * deterministic and the stable surface always comes first.
 */
function readEntries() {
  // `index.json` is the generated aggregate of these files, not a component.
  const files = readdirSync(REGISTRY_DIR).filter((f) => f.endsWith(".json") && f !== "index.json")
  const entries = files.map((file) => {
    const parsed = JSON.parse(readFileSync(join(REGISTRY_DIR, file), "utf8"))
    return { file, ...parsed }
  })
  entries.sort((a, b) => {
    const byStability = (STABILITY_ORDER[a.stability] ?? 9) - (STABILITY_ORDER[b.stability] ?? 9)
    return byStability !== 0 ? byStability : a.name.localeCompare(b.name)
  })
  return entries
}

/** The component's custom-element tag: `button` → `sk-button`. */
const tagOf = (entry) => `sk-${entry.name}`

function renderIndex(entries, tokens) {
  const lines = []
  lines.push("# Santaka UI")
  lines.push("")
  lines.push("> One design system for every framework. Design tokens, accessible Web")
  lines.push("> Components, and thin React/Vue/Svelte/Angular adapters. Framework-agnostic:")
  lines.push("> the universal custom elements own behavior, adapters only adapt.")
  lines.push("")
  lines.push("## What this is")
  lines.push("")
  lines.push("Santaka ships a token layer and a set of accessible custom elements. The")
  lines.push("universal package (`@santaka-ui/web-components`) is the source of truth for")
  lines.push("behavior; framework packages are adapters over the same elements. There is one")
  lines.push("implementation of every interaction, not one per framework.")
  lines.push("")
  lines.push("## Install")
  lines.push("")
  lines.push("```bash")
  lines.push("pnpm add @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles")
  lines.push("```")
  lines.push("")
  lines.push("```js")
  lines.push('import "@santaka-ui/tokens/css"')
  lines.push('import "@santaka-ui/styles/index.css"')
  lines.push('import "@santaka-ui/web-components"')
  lines.push('import "@santaka-ui/web-components/santaka.css"')
  lines.push("```")
  lines.push("")
  lines.push('React: `import { Button } from "@santaka-ui/react"`. The elements are the same')
  lines.push("ones; the adapter forwards props and events.")
  lines.push("")
  lines.push("## Token contract")
  lines.push("")
  lines.push("Tokens are DTCG source compiled to CSS custom properties, light and dark. The")
  lines.push("custom properties are the public contract:")
  lines.push("")
  lines.push("```css")
  lines.push(":root                     { /* light theme */ }")
  lines.push('[data-sk-theme="dark"]    { /* dark theme  */ }')
  lines.push("```")
  lines.push("")
  lines.push(`There are ${tokens.total} custom properties in each theme. The groups are:`)
  lines.push("")
  for (const group of tokens.groups) {
    lines.push(`- \`--sk-${group.name}-*\` — ${group.count} tokens`)
  }
  lines.push("")
  lines.push('Set `data-sk-theme="dark"` on any ancestor to switch themes. Direction comes')
  lines.push('from `dir="rtl"` on any ancestor; there is no RTL build and no second')
  lines.push("stylesheet.")
  lines.push("")
  lines.push("## Components")
  lines.push("")
  for (const entry of entries) {
    lines.push(`- **${tagOf(entry)}** (${entry.stability}) — ${entry.ai.summary}`)
  }
  lines.push("")
  lines.push("## Full reference")
  lines.push("")
  lines.push("- [llms-full.txt](./llms-full.txt) — every component's props, variants,")
  lines.push("  accessibility notes, and example, in one file.")
  lines.push("")
  lines.push("## Key conventions")
  lines.push("")
  lines.push("- Styling hooks are `data-slot` attributes; components use scoped CSS, never a")
  lines.push("  shadow root, so consumer CSS and utility classes reach internals.")
  lines.push("- Booleans that mirror an ARIA state use the ARIA name verbatim (`checked`,")
  lines.push("  `open`, `disabled`).")
  lines.push("- `variant` and `size` are the only visual-configuration props; everything")
  lines.push("  else is state.")
  lines.push("- Form controls are form-associated custom elements: they submit through a")
  lines.push("  plain `<form>` with no JavaScript state.")
  lines.push("")
  return lines.join("\n")
}

function renderFull(entries, propTypes) {
  const lines = []
  lines.push("# Santaka UI — full component reference")
  lines.push("")
  lines.push("Generated from the registry metadata and the component type declarations.")
  lines.push("Every component below is a custom element; the React/Vue/Svelte/Angular")
  lines.push("packages are adapters over the same element.")
  lines.push("")

  for (const entry of entries) {
    const tag = tagOf(entry)
    const ai = entry.ai
    lines.push(`## ${tag}`)
    lines.push("")
    lines.push(`- Stability: ${entry.stability}`)
    lines.push(`- Framework packages: ${(entry.frameworks ?? []).join(", ")}`)
    lines.push(`- Locales covered: ${(entry.localesCovered ?? []).join(", ") || "none"}`)
    if (entry.events?.length) {
      lines.push(`- Events: ${entry.events.map((name) => `\`${name}\``).join(", ")}`)
    }
    lines.push("")
    lines.push(ai.summary)
    lines.push("")
    lines.push("**When to use**")
    lines.push("")
    for (const item of ai.whenToUse ?? []) lines.push(`- ${item}`)
    lines.push("")
    lines.push("**When not to use**")
    lines.push("")
    for (const item of ai.whenNotToUse ?? []) lines.push(`- ${item}`)
    lines.push("")
    lines.push("**Accessibility**")
    lines.push("")
    lines.push(ai.accessibility)
    lines.push("")
    lines.push("**Example**")
    lines.push("")
    lines.push("```html")
    lines.push(ai.example)
    lines.push("```")
    lines.push("")
    if (ai.knownLimitations?.length) {
      lines.push("**Known limitations**")
      lines.push("")
      for (const item of ai.knownLimitations) lines.push(`- ${item}`)
      lines.push("")
    }

    const props = propsFor(propTypes, entry.name)
    if (props.length > 0) {
      lines.push("**Props**")
      lines.push("")
      lines.push("| Prop | Type | Default | Description |")
      lines.push("|---|---|---|---|")
      for (const prop of props) {
        const def = prop.default === null ? "—" : `\`${prop.default}\``
        const type = prop.type.replace(/\|/g, "\\|")
        const desc = prop.description.replace(/\|/g, "\\|") || "—"
        lines.push(`| \`${prop.name}\` | \`${type}\` | ${def} | ${desc} |`)
      }
      lines.push("")
    }
  }
  return lines.join("\n")
}

/** Summarize the compiled theme's token groups, for the index's contract section. */
function readTokenGroups() {
  const css = readFileSync(join(repoRoot, "packages", "tokens", "dist", "css", "light.css"), "utf8")
  const names = [...css.matchAll(/^\s*(--sk-[a-z0-9-]+)\s*:/gm)].map((m) => m[1])
  const groups = new Map()
  for (const name of names) {
    // The group is the first segment after `--sk-`: `--sk-color-primary` → color.
    const group = name.replace(/^--sk-/, "").split("-")[0]
    groups.set(group, (groups.get(group) ?? 0) + 1)
  }
  return {
    total: names.length,
    groups: [...groups.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count })),
  }
}

const argv = process.argv.slice(2)
const toStdout = argv.includes("--stdout")
const check = argv.includes("--check")

const entries = readEntries()
const propTypes = readComponentTypes(TYPES_FILE)
const tokens = readTokenGroups()

const index = renderIndex(entries, tokens)
const full = renderFull(entries, propTypes)

const files = [
  { path: join(OUT_DIR, "llms.txt"), content: index },
  { path: join(OUT_DIR, "llms-full.txt"), content: full },
]

if (toStdout) {
  for (const file of files) {
    process.stdout.write(`===== ${file.path} =====\n${file.content}\n`)
  }
  process.exit(0)
}

if (check) {
  let drifted = false
  for (const file of files) {
    const actual = existsSync(file.path) ? readFileSync(file.path, "utf8") : null
    if (actual !== file.content) {
      console.error(`[llms] ${file.path} is out of date.`)
      drifted = true
    }
  }
  if (drifted) {
    console.error("[llms] Regenerate: pnpm --filter @santaka-ui/core generate:llms")
    process.exit(1)
  }
  console.log("[llms] llms.txt and llms-full.txt match the registry metadata.")
  process.exit(0)
}

mkdirSync(OUT_DIR, { recursive: true })
for (const file of files) {
  writeFileSync(file.path, file.content)
  console.log(`[llms] wrote ${file.path}`)
}
console.log(`[llms] ${entries.length} components, ${tokens.total} tokens per theme`)
