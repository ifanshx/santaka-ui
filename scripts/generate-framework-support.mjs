#!/usr/bin/env node
/**
 * Framework support matrix (docs/ARCHITECTURE.md §3 and §16, "The public framework/browser
 * support matrix reflects tested evidence").
 *
 * The browser half of that gate is `docs/browser-support.md`, derived from the
 * Playwright projects that actually run. This is the framework half, and it has
 * the same problem to solve: a support claim is a promise, and a promise in a
 * README with nothing behind it is the one kind of documentation that gets worse
 * as the project grows — a reader cannot tell "tested" from "intended".
 *
 * So the matrix is *checked*, not typed:
 *
 *   - A **Stable** row names the adapter package, the example application, and
 *     the test command that back it, and the check fails if any of the three is
 *     missing. A claim with no example is a claim with nothing to regress.
 *   - A **Planned** row names where that support would live, and the check fails
 *     if it appears there — so adding a Svelte adapter cannot leave this document
 *     saying Svelte is unbuilt.
 *   - Every directory in `packages/`, `examples/`, and `apps/` must be accounted
 *     for by some row or listed as not-a-framework-package. A new example is a
 *     new support claim whether or not anyone writes it down, and this is where
 *     the omission surfaces.
 *
 * What the document deliberately does NOT contain is a per-target pass/fail
 * column, for the reason `docs/browser-support.md` gives: the result is volatile,
 * so a committed "passing" is either stale or re-verified on every run by running
 * the whole suite, and a document that drifts is worse than one that claims less.
 * What it states is the stable fact — which targets are claimed, what backs each
 * claim, and which CI job defends it.
 *
 * Usage:
 *   node scripts/generate-framework-support.mjs           # write docs/framework-support.md
 *   node scripts/generate-framework-support.mjs --stdout  # print, do not write
 *   node scripts/generate-framework-support.mjs --check   # exit 1 if the file drifts
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..")

export const OUT_PATH = join(repoRoot, "docs", "framework-support.md")

/** The document is generated; this is the command that regenerates it. */
const REGENERATE = "pnpm run framework-support"

/**
 * Publishable packages that are not framework adapters. They still appear in
 * `packages/`, so the accounting check needs to know about them; they are not
 * targets, so they do not get a row.
 */
export const NON_FRAMEWORK_PACKAGES = ["cli", "core", "mcp", "styles", "tokens", "utilities"]

/** Applications that are not framework examples, for the same reason. */
export const NON_FRAMEWORK_APPS = ["docs", "storybook"]

/**
 * The matrix, in the order `docs/ARCHITECTURE.md` §3 lists it. Values are the states, not
 * goals: a row is Stable only while the artifacts it names exist and a CI job
 * runs its gate.
 *
 * `scripts` is what the check reads out of the example's own `package.json`, so
 * the commands quoted below cannot silently stop existing.
 */
export const TARGETS = [
  {
    id: "react-vite",
    target: "React + Vite",
    state: "Stable",
    implementation: "React-native package; source and package modes",
    gate: "Type checks, unit/component tests, production build, keyboard/accessibility checks",
    packages: ["packages/react"],
    examples: ["examples/react-vite"],
    scripts: [{ dir: "examples/react-vite", name: "test" }],
    testCommand: "pnpm --filter @santaka-ui/example-react-vite test",
    ciJob: "react-example",
    note: null,
  },
  {
    id: "nextjs",
    target: "Next.js",
    state: "Stable",
    implementation: "React package with documented SSR and Client Component guidance",
    gate: "Production build, hydration smoke tests, CSS and client-boundary checks",
    packages: ["packages/react"],
    examples: ["examples/nextjs"],
    scripts: [{ dir: "examples/nextjs", name: "test:ssr" }],
    testCommand: "pnpm --filter @santaka-ui/example-nextjs test:ssr",
    ciJob: "nextjs-example",
    note: "The adapter is the React package; Next.js adds the server-render contract on top of it. `examples/nextjs` proves that contract by rendering every shipped tag with its public attributes on the server, defining nothing there, and hydrating without a mismatch (ADR-005).",
  },
  {
    id: "plain-html",
    target: "Plain HTML / JavaScript",
    state: "Stable",
    implementation: "Web Components + CSS, no framework runtime requirement",
    gate: "Browser tests in a minimal HTML fixture",
    packages: ["packages/web-components"],
    examples: ["examples/vanilla-html"],
    scripts: [{ dir: "packages/web-components", name: "test" }],
    testCommand: "pnpm --filter @santaka-ui/web-components test",
    ciJob: "browsers",
    note: "`examples/vanilla-html` is mounted by the Playwright config rather than built, so it carries no `package.json` of its own; the suite that drives it is the web-components package's own `test` script, run per engine by the `browsers` matrix job.",
  },
  {
    id: "vue-vite",
    target: "Vue 3 + Vite",
    state: "Stable",
    implementation: "Vue wrappers/adapters and/or direct Web Components use",
    gate: "Props, emitted events, forms, styling, production build",
    packages: ["packages/vue"],
    examples: ["examples/vue-vite"],
    scripts: [{ dir: "examples/vue-vite", name: "test" }],
    testCommand: "pnpm --filter @santaka-ui/example-vue-vite test",
    ciJob: "vue-example",
    note: "Vue chooses between a property and an attribute per component, so the adapter can take a route React never takes; the example is a separate CI job for that reason, not a second step in the React job.",
  },
  {
    id: "nuxt",
    target: "Nuxt",
    state: "Planned",
    implementation: "Vue integration with SSR/hydration guidance",
    gate: "Server rendering, hydration, route-level example",
    wouldLiveAt: ["packages/nuxt", "examples/nuxt"],
    note: "Nothing exists. Nuxt is the SSR path for the Vue adapter, which is Stable on its own; the missing piece is the server-render and hydration proof, the same class of evidence `examples/nextjs` provides for React.",
  },
  {
    id: "svelte",
    target: "Svelte (Vite + SSR)",
    state: "Stable",
    implementation: "Elements used directly, plus a types-only subpath and a theme store",
    gate: "Props/events, form submission, SSR markup and hydration, theme contract",
    packages: ["packages/svelte"],
    examples: ["examples/svelte-vite"],
    scripts: [{ dir: "examples/svelte-vite", name: "test" }],
    testCommand: "pnpm --filter @santaka-ui/example-svelte-vite test",
    ciJob: "svelte-example",
    note: "No wrapper components, and that is measured: Svelte 5 already decides per write whether a prop reaches the element's property or its attribute — the setters the element exposes once it is registered, an object-valued prop as a property while it is not — so the package ships the two things Svelte cannot supply, `@santaka-ui/svelte/elements` for types and a theme store for section 6, and nothing else (ADR-021). Server rendering turned up a rule the whole repository now shares: because the elements are scoped and have no shadow root (ADR-011), registering them *before* hydration mutates the tree being hydrated, Svelte abandons the server's markup and mounts again. Register after hydration. The example's test asserts both the node identity and the hydration markers, so the order cannot regress silently. The row is Svelte, not SvelteKit: the Vite SSR build is what is proven, and SvelteKit's own server entry has its own row below.",
  },
  {
    id: "sveltekit",
    target: "SvelteKit",
    state: "Planned",
    implementation: "The Svelte adapter plus SvelteKit's own server entry and routing",
    gate: "SvelteKit server render, hydration, route-level example",
    wouldLiveAt: ["packages/kit", "examples/sveltekit"],
    note: "Unmeasured rather than unbuilt. The SSR rule SvelteKit would rely on is proven — `examples/svelte-vite` server-renders and asserts that hydration reused the server's nodes — but SvelteKit's own server entry is not exercised by it, and the gate now says so instead of leaving it implicit. It is blocked on a dependency conflict, not on design: `@sveltejs/kit@3.1.0` peer-requires `typescript ^6.0.0` while this workspace pins 5.9.3, so adopting it means a TypeScript major across every package (ADR-021). Splitting the row is the point: one label covering both made a measured target and an unmeasured one look identical.",
  },
  {
    id: "angular",
    target: "Angular",
    state: "Planned",
    implementation: "Angular integration package and typing",
    gate: "Inputs, outputs, forms, production build and accessibility tests",
    wouldLiveAt: ["packages/angular", "examples/angular"],
    note: "Nothing exists. Angular's forms integration and its production build are the parts that need proving, because both are where an adapter over custom elements tends to break.",
  },
  {
    id: "astro",
    target: "Astro",
    state: "Planned",
    implementation: "Web Components integration and framework-island examples",
    gate: "Static build, client hydration paths and custom-element loading",
    wouldLiveAt: ["packages/astro", "examples/astro"],
    note: "An Astro application does exist — `apps/docs` builds this project's own component reference as a static site and loads the custom elements inside islands — but that is the documentation site, which happens to be written in Astro (ADR-006). It is not a consumer integration and nothing checks it as one, so the target stays Planned. It is worth naming, because the first half of the gate is already exercised by accident.",
  },
  {
    id: "others",
    target: "Solid, Preact, Qwik and others",
    state: "Planned",
    implementation: "Community or official adapters after validation",
    gate: "Framework-specific compatibility suite",
    wouldLiveAt: ["packages/solid", "packages/preact", "packages/qwik"],
    note: "Nothing exists. These are demand-driven, not scheduled: the universal package is the intended answer for a framework with no adapter, and an adapter is added when a compatibility suite can be written for it.",
  },
  {
    id: "native",
    target: "React Native, Flutter, native desktop",
    state: "Planned",
    implementation: "Separate future product decision",
    gate: "Requires native renderers; not covered by web support claims",
    wouldLiveAt: [],
    note: "No package would live in this repository: these need native renderers, which is a separate implementation strategy rather than a Web Components adapter. Named here so the absence is a decision rather than an omission.",
  },
]

/** Read a directory's entry names, or an empty list if it does not exist. */
function listDirs(absolute) {
  try {
    return readdirSync(absolute, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}

/** The real repository, as the checks see it. Tests inject a fake. */
export function repoContext() {
  return {
    dirExists: (rel) => existsSync(join(repoRoot, rel)),
    scriptsOf: (rel) => {
      try {
        const parsed = JSON.parse(readFileSync(join(repoRoot, rel, "package.json"), "utf8"))
        return Object.keys(parsed.scripts ?? {})
      } catch {
        return null
      }
    },
    listDirs: (rel) => listDirs(join(repoRoot, rel)),
  }
}

/**
 * Check one row against the tree. Returns a list of human-readable problems;
 * empty means the row's claim is backed.
 *
 * A Stable row must name all three kinds of artifact — the package, the example,
 * and the test command — because a claim that names fewer than three cannot be
 * checked at all, and an unverifiable claim is what this file exists to prevent.
 */
export function verifyRow(row, ctx) {
  const problems = []
  const where = `${row.target} (${row.state})`

  if (row.state !== "Stable" && row.state !== "Planned") {
    problems.push(`${where}: unknown state; must be Stable or Planned`)
    return problems
  }

  // The document renders these three into cells. An empty one is a row that says
  // nothing, which is the failure mode this file exists to make impossible.
  if (!row.implementation) problems.push(`${where}: names no planned implementation`)
  if (!row.gate) problems.push(`${where}: names no release gate`)
  if (row.state === "Planned" && !row.note) {
    problems.push(`${where}: a Planned row must say what is missing`)
  }

  if (row.state === "Stable") {
    const packages = row.packages ?? []
    const examples = row.examples ?? []
    const scripts = row.scripts ?? []

    if (packages.length === 0) problems.push(`${where}: names no adapter package`)
    if (examples.length === 0) problems.push(`${where}: names no example application`)
    if (scripts.length === 0) problems.push(`${where}: names no test command`)

    for (const dir of [...packages, ...examples]) {
      if (!ctx.dirExists(dir)) problems.push(`${where}: ${dir} does not exist`)
    }

    for (const { dir, name } of scripts) {
      const available = ctx.scriptsOf(dir)
      if (available === null) {
        problems.push(`${where}: ${dir}/package.json is missing, so \`${name}\` cannot be checked`)
      } else if (!available.includes(name)) {
        problems.push(`${where}: ${dir} has no \`${name}\` script`)
      }
    }
  }

  for (const dir of row.wouldLiveAt ?? []) {
    if (ctx.dirExists(dir)) {
      problems.push(
        `${where}: ${dir} exists, so this target is built; update its state rather than leaving it Planned`,
      )
    }
  }

  return problems
}

/**
 * Every directory in `packages/`, `examples/`, and `apps/` must be accounted for:
 * either it is named by a Stable row, or it is on the not-a-framework list. This
 * is the check that catches the opposite drift — support that exists and is not
 * in the document.
 */
export function verifyAccounting(rows, ctx) {
  const problems = []

  const claimed = (key) =>
    new Set(rows.flatMap((row) => (row[key] ?? []).map((dir) => dir.split("/").at(-1))))

  const accounting = [
    { dir: "packages", claimed: claimed("packages"), known: NON_FRAMEWORK_PACKAGES },
    { dir: "examples", claimed: claimed("examples"), known: [] },
    { dir: "apps", claimed: claimed("apps"), known: NON_FRAMEWORK_APPS },
  ]

  for (const { dir, claimed: named, known } of accounting) {
    for (const entry of ctx.listDirs(dir)) {
      if (!named.has(entry) && !known.includes(entry)) {
        problems.push(
          `${dir}/${entry} is not named by any row and is not on the not-a-framework list`,
        )
      }
    }
  }

  return problems
}

/** Wrap prose to a fixed width so the generated document reads like the others. */
function wrap(text, width = 88) {
  const lines = []
  let line = ""
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (line === "") line = word
    else if (line.length + 1 + word.length <= width) line += ` ${word}`
    else {
      lines.push(line)
      line = word
    }
  }
  if (line !== "") lines.push(line)
  return lines
}

/** Render the document. Deterministic: same rows, same bytes. */
export function renderDocument(rows) {
  const lines = []

  lines.push("# Framework support")
  lines.push("")
  lines.push("<!-- Generated by scripts/generate-framework-support.mjs. Do not edit by hand.")
  lines.push("     Every claim below is checked against the repository: a Stable target must")
  lines.push("     name an adapter package, an example, and a test command, and they must")
  lines.push("     exist. A Planned target must not name a package that has been built.")
  lines.push(`     Regenerate with \`${REGENERATE}\`. -->`)
  lines.push("")
  lines.push(
    ...wrap(
      "Three states (docs/ARCHITECTURE.md §3), and the difference between them is what is defended " +
        "automatically, not how much code exists. **Stable** means the release gate runs in " +
        "CI on every change. **Preview** means an example exists and works but the gate is " +
        "not enforced automatically, so the claim is not defended against regression. " +
        "**Planned** means nothing has been built. No target is currently at Preview.",
    ),
  )
  lines.push("")
  lines.push("| Target | State | Implementation | Release gate | Defended by |")
  lines.push("|---|---|---|---|---|")
  for (const row of rows) {
    const defense = row.ciJob ? `\`${row.ciJob}\` CI job` : "—"
    lines.push(
      `| ${row.target} | **${row.state}** | ${row.implementation} | ${row.gate} | ${defense} |`,
    )
  }
  lines.push("")
  lines.push("## What backs each Stable claim")
  lines.push("")
  lines.push(
    ...wrap(
      "The command in each block is what a reviewer runs to reproduce the claim; the same " +
        "command, or the suite it names, is what the CI job runs on every change.",
    ),
  )
  lines.push("")
  for (const row of rows.filter((entry) => entry.state === "Stable")) {
    lines.push(`### ${row.target}`)
    lines.push("")
    lines.push(`- Adapter: ${row.packages.map((dir) => `\`${dir}\``).join(", ")}`)
    lines.push(`- Example: ${row.examples.map((dir) => `\`${dir}\``).join(", ")}`)
    lines.push(`- Test: \`${row.testCommand}\``)
    lines.push(`- CI job: \`${row.ciJob}\``)
    if (row.note) {
      lines.push("")
      lines.push(...wrap(row.note))
    }
    lines.push("")
  }
  lines.push("## Why each Planned target is Planned")
  lines.push("")
  for (const row of rows.filter((entry) => entry.state === "Planned")) {
    lines.push(...wrap(`**${row.target}.** ${row.note}`))
    lines.push("")
  }
  lines.push("## How this document is checked")
  lines.push("")
  lines.push(
    ...wrap(
      "`node scripts/generate-framework-support.mjs --check` fails, and the `framework-matrix` " +
        "CI job runs it, when:",
    ),
  )
  lines.push("")
  lines.push(
    ...wrap("- a Stable row names a package, an example, or a test script that does not exist."),
  )
  lines.push(
    ...wrap(
      "- a Planned row's directory appears — building an adapter without updating this " +
        "document is the drift that matters most, because it makes the document wrong in " +
        "the direction that loses a supported target;",
      86,
    ).map((line, index) => (index === 0 ? line : `  ${line}`)),
  )
  lines.push(
    ...wrap("- a directory appears under `packages/`, `examples/`, or `apps/` that no row names."),
  )
  lines.push("")
  lines.push(
    ...wrap(
      "It does not assert that the tests pass. That is what the CI jobs named above are for, " +
        "and a document that committed to a pass/fail result would be stale by the next commit.",
    ),
  )

  return `${lines.join("\n").trimEnd()}\n`
}

/** Run the verification and return every problem, not just the first. */
export function collectProblems(rows, ctx = repoContext()) {
  return [...rows.flatMap((row) => verifyRow(row, ctx)), ...verifyAccounting(rows, ctx)]
}

function main() {
  const toStdout = process.argv.includes("--stdout")
  const check = process.argv.includes("--check")

  const problems = collectProblems(TARGETS)
  if (problems.length > 0) {
    console.error("[framework-matrix] the matrix does not match the repository:")
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error(`[framework-matrix] fix the row, or regenerate with \`${REGENERATE}\`.`)
    process.exit(1)
  }

  const expected = renderDocument(TARGETS)

  if (check) {
    let actual = ""
    try {
      actual = readFileSync(OUT_PATH, "utf8")
    } catch {
      console.error(`[framework-matrix] ${OUT_PATH} is missing. Run \`${REGENERATE}\` to write it.`)
      process.exit(1)
    }
    if (actual !== expected) {
      console.error(
        "[framework-matrix] docs/framework-support.md is out of date with the repository.",
      )
      console.error(`[framework-matrix] Regenerate: ${REGENERATE}`)
      process.exit(1)
    }
    console.log("[framework-matrix] docs/framework-support.md matches the repository.")
    process.exit(0)
  }

  if (toStdout) {
    process.stdout.write(expected)
    process.exit(0)
  }

  writeFileSync(OUT_PATH, expected)
  const stable = TARGETS.filter((row) => row.state === "Stable")
  console.log(`[framework-matrix] wrote ${OUT_PATH}`)
  console.log(
    `[framework-matrix] ${stable.length} stable, ${TARGETS.length - stable.length} planned`,
  )
}

// Only run when invoked as a program, so the tests can import the checks.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
