/**
 * Build `@santaka-ui/styles`.
 *
 * The stylesheets are authored by hand and shipped as-is. There is nothing to
 * compile, so "build" means: validate that every CSS custom property these
 * files reference is actually defined by the token themes, then concatenate
 * the entrypoint. A stylesheet that references an undefined token is the one
 * failure mode that silently renders as "wrong color", so it fails the build.
 *
 * `--check` runs the same validation without writing, for CI.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const srcDir = join(pkgRoot, "src")
const outDir = join(pkgRoot, "dist")

const SOURCES = ["reset.css", "base.css", "primitives.css", "glass.css"]
const checkOnly = process.argv.includes("--check")

/** Defined tokens come from the compiled themes, not from a hand-kept list. */
const tokenCss = join(pkgRoot, "..", "tokens", "dist", "css", "light.css")

function definedTokens() {
  if (!existsSync(tokenCss)) {
    throw new Error(
      "[styles] @santaka-ui/tokens has not been built. Run: pnpm --filter @santaka-ui/tokens build",
    )
  }
  const css = readFileSync(tokenCss, "utf8")
  return new Set([...css.matchAll(/^\s*(--sk-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]))
}

/**
 * Every `var(--sk-*, fallback)` reference must either resolve to a real token
 * or carry an explicit fallback. A bare reference to a token that does not
 * exist renders as no declaration at all.
 */
function assertTokensAreSatisfied(css, defined) {
  const problems = []
  for (const match of css.matchAll(/var\(\s*(--sk-[a-z0-9-]+)\s*([,)])/g)) {
    const name = match[1]
    if (defined.has(name)) continue
    if (match[2] === ",") continue // explicit fallback, renders predictably
    problems.push(`  ${name} is referenced without a fallback and is not a defined token`)
  }
  if (problems.length > 0) {
    throw new Error(`[styles] undefined token references:\n${[...new Set(problems)].join("\n")}`)
  }
}

function main() {
  const defined = definedTokens()
  const parts = []

  for (const name of SOURCES) {
    const source = join(srcDir, name)
    if (!existsSync(source)) throw new Error(`[styles] missing source file: ${name}`)
    parts.push(readFileSync(source, "utf8").trim())
  }

  // A stylesheet may define its own `--sk-*` alias (for example
  // `--sk-font-body: var(--sk-font-sans, ...)`). Those are resolved locally,
  // so they count as defined for the purposes of this check.
  const declared = new Set(
    parts.flatMap((css) => [...css.matchAll(/^\s*(--sk-[a-z0-9-]+)\s*:/gm)].map((m) => m[1])),
  )
  for (const name of declared) defined.add(name)

  const used = parts.join("\n\n")
  for (const css of parts) assertTokensAreSatisfied(css, defined)

  const usedTokens = new Set([...used.matchAll(/var\(\s*(--sk-[a-z0-9-]+)/g)].map((m) => m[1]))
  console.log(
    `[styles] ${SOURCES.length} stylesheets validated against ${defined.size} defined tokens (${usedTokens.size} referenced)`,
  )

  if (checkOnly) return

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  for (const name of SOURCES) {
    writeFileSync(join(outDir, name), `${readFileSync(join(srcDir, name), "utf8").trim()}\n`)
  }

  const banner = `/*
 * Santaka UI — styles entrypoint.
 * Import once in your application CSS, after the token themes:
 *
 *   @import "@santaka-ui/tokens/css/index.css";
 *   @import "@santaka-ui/styles/index.css";
 */
`
  writeFileSync(
    join(outDir, "index.css"),
    `${banner}\n${parts.map((part, i) => `/* ${SOURCES[i]} */\n${part}`).join("\n\n")}\n`,
  )
  console.log(`[styles] wrote ${outDir}`)
}

main()
