# ADR-018: Toolchain defaults table

- **Status:** Accepted
- **Date:** 2026-10-12
- **Plan deadline:** end of weeks 1–2 (`plan.md` §18)

## Context

`plan.md` §5 lists the toolchain as "decisions, not suggestions", each to be
re-affirmed here. The point of writing it down is not the list; it is the rule at
the bottom of that section — *no additional linter is added without an ADR* —
which only has force if there is a document saying which tools are in and which
are out.

Four tools named in §5 are deliberately not used, and the concerns that once had
no implementation at all — the docs site and the CLI — now have one, so their
rows are gone from the table below. This ADR records each *remaining* deviation
with its reason, so a reader does not have to diff the plan against the lockfile
to find out whether an absence is a decision or an oversight.
`eslint.config.js` already cites this record for the "no second linter" rule.

## Decision

### Adopted as specified

| Concern | Tool | Evidence |
|---|---|---|
| Runtime and package manager | Node `>=22.11.0`, pnpm 10 via corepack | `engines` on all nine packages; `packageManager: pnpm@10.34.7` |
| Task orchestration | Turborepo | `turbo.json`; cache-aware pipeline |
| Language | TypeScript 5.x, `strict`, `noUncheckedIndexedAccess` | `tooling/typescript/base.json`, plus `verbatimModuleSyntax`, `noImplicitOverride`, `noFallthroughCasesInSwitch` |
| Lint and format | ESLint 9 flat config + typescript-eslint, Prettier 3 | `eslint.config.js`, `.prettierrc.json` |
| Vue SFC lint | `eslint-plugin-vue` + `vue-eslint-parser` | `eslint.config.js`, the `**/*.vue` block |
| Unit tests | Vitest | `packages/tokens`, `packages/react` |
| Browser and E2E tests | Playwright | `packages/web-components/e2e`, three baseline projects |
| Accessibility | `axe-core` + `@axe-core/playwright` | `e2e/a11y.e2e.ts`, scope in ADR-008 |
| Package health | `publint` + `@arethetypeswrong/cli` | `validate:package` on all nine, release-blocking |
| Release and versioning | Changesets, npm provenance | `.changeset/`, `publish.yml` publishes with provenance |
| CI | GitHub Actions, one required workflow | `.github/workflows/ci.yml`, steps in the §5 order |

### Deviations, each recorded rather than silent

| Concern | §5 says | What exists | Why |
|---|---|---|---|
| Token pipeline | `style-dictionary` | A bespoke pipeline (`packages/tokens/scripts/`) | ADR-002. The emitted contract is "hex then `oklch()` behind `@supports`", which `style-dictionary` cannot express; a transform plugin to fake it was more code than the pipeline. |
| Bundle budgets | `size-limit` | `scripts/measure-bundle.mjs` | ADR-010. Budgets are per-component and per-theme, which `size-limit`'s entrypoint model does not express, and the measurement must throw when it finds nothing to measure. |
| Dependency hygiene | `knip` | Not used | Absent, not replaced. §5 itself schedules it as a non-blocking job that "becomes blocking once the workspace is clean"; the workspace has never been run through it. |
| Storybook | Storybook 9, React renderer first | `apps/storybook`, Storybook 10 | ADR-020. §10's workshop is built; the version moved 9 → 10, and the ADR records what one React-renderer setup cannot host (the Vue, Svelte, and Angular adapters). |
| `tooling/` layout | `tooling/{eslint,typescript,test-config}` | Only `tooling/typescript` | ESLint config is at the root (flat config is naturally root-anchored); there is no shared test-config package. Recorded as a deviation, not a plan to fill the tree — §5 says "do not generate empty packages just to fill the directory tree". |

### Two concerns where the specification is only partly met

- **Vitest with `jsdom`.** Vitest is used in two packages. `jsdom` is the
  environment for `@santaka-ui/react` only; `@santaka-ui/tokens` runs in the
  default Node environment, which is correct for pipeline math. There is **no
  unit-test layer for `@santaka-ui/web-components`** — its behavior is proven in
  Chromium by Playwright, which §5 explicitly permits ("real browser behavior is
  covered by Playwright"). The honest statement is that the jsdom component-test
  layer §5 describes does not exist for the universal package, and the browser
  suite is what stands in for it. Recorded in `plan.md` §17 rather than claimed.
- **Playwright Core and Baseline projects.** The three baseline projects
  (`chromium-baseline`, `firefox-baseline`, `webkit-baseline`) exist. A separate
  **Core-tier** project does not, and cannot: Playwright bundles one revision
  per engine, so it cannot launch Chrome 90, Firefox 121, or Safari 15.4. The
  Core tier is exercised two ways instead — by *reproducing the Core branch of a
  stylesheet* inside the existing projects where a component needs it (Icon
  Button's square target, which cancels the Baseline branch and applies the
  `@supports` fallback by injection), and by a conformance test in
  `e2e/conventions.e2e.ts` that fails on a Baseline-only feature used outside an
  `@supports` block. The second was added after three stylesheets were found
  using bare `:has()`; until then the ban had no enforcement, exactly like the
  physical-property ban before ADR-016. `docs/browser-support.md` states the
  limit rather than claiming Core is launched. ADR-019 adds a `visual` project
  on top of these, which is a test-layer addition rather than a browser-tier one.

### The rule this ADR exists to hold

**No additional linter is added without an ADR.** ESLint plus Prettier plus
TypeScript covers linting, formatting, and types; a second linter is a decision
that needs a record, not a dependency that needs installing. `eslint.config.js`
cites this ADR for that rule.

The Vue example added `eslint-plugin-vue` and `vue-eslint-parser` on
2026-10-16. This is an **extension of the existing linter, not a second one** —
the plugin runs inside ESLint 9, sharing its config, its rules, and its exit
code — so the rule above is satisfied by an entry here rather than by a new ADR.
It was necessary rather than optional: the flat config matched only
`**/*.{ts,tsx,mts,cts}`, so `examples/vue-vite/src/App.vue` was silently
unlinted. `eslint .` exited 0 while skipping the file, which is worse than
running no linter at all, because the exit code claimed coverage it did not have.
That was verified by injecting an unused variable into the SFC: before the block,
`eslint .` passed; after it, the same injection fails. The parser is configured
with `typescript-eslint` as the inner parser for `<script lang="ts">`, so the
rules that apply to the adapter packages apply inside the SFC.

## Consequences

- Absences are recorded, not papered over. Where §5 names a tool the workspace
  does not use at all — `knip` is the one — the row says so and says why. Where
  a tool was replaced by an alternative, the replacement is named
  (`style-dictionary` → the bespoke pipeline, `size-limit` →
  `scripts/measure-bundle.mjs`). A missing tool is never left to read as if it
  were "done differently" without a record. The docs site (Astro + Pagefind,
  ADR-006) and the CLI (`cac`/`kleur`) have since landed and left this table;
  Storybook moved from absent to a documented implementation (ADR-020).
- A new tool added to the workspace without an entry here is a deviation from
  §5. The remedy is an ADR, and for a linter it is required rather than
  encouraged.
- Replacing an adopted tool means updating this table and the ADR that justified
  the original choice (ADR-002 for tokens, ADR-010 for budgets).

## What would reverse this

Nothing about the adopted column is contested. The deviations reverse as the
work lands: `knip` becomes relevant once the workspace is worth sweeping, and it
is the one still outstanding. The others have landed — `cac`/`kleur` when the CLI
shipped, Astro + Pagefind when the docs site did, Storybook when §10 was built —
each with its own ADR where the plan called for one (ADR-006 for docs, ADR-009
for the CLI, ADR-020 for Storybook).
