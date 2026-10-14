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

Four tools named in §5 are deliberately not used, and two concerns have no
implementation at all. This ADR records each deviation with its reason, so a
reader does not have to diff the plan against the lockfile to find out whether an
absence is a decision or an oversight. `eslint.config.js` already cites this
record for the "no second linter" rule.

## Decision

### Adopted as specified

| Concern | Tool | Evidence |
|---|---|---|
| Runtime and package manager | Node `>=22.11.0`, pnpm 10 via corepack | `engines` on all six packages; `packageManager: pnpm@10.34.7` |
| Task orchestration | Turborepo | `turbo.json`; cache-aware pipeline |
| Language | TypeScript 5.x, `strict`, `noUncheckedIndexedAccess` | `tooling/typescript/base.json`, plus `verbatimModuleSyntax`, `noImplicitOverride`, `noFallthroughCasesInSwitch` |
| Lint and format | ESLint 9 flat config + typescript-eslint, Prettier 3 | `eslint.config.js`, `.prettierrc.json` |
| Unit tests | Vitest | `packages/tokens`, `packages/react` |
| Browser and E2E tests | Playwright | `packages/web-components/e2e`, three baseline projects |
| Accessibility | `axe-core` + `@axe-core/playwright` | `e2e/a11y.e2e.ts`, scope in ADR-008 |
| Package health | `publint` + `@arethetypeswrong/cli` | `validate:package` on all six, release-blocking |
| Release and versioning | Changesets, npm provenance | `.changeset/`, `publish.yml` publishes with provenance |
| CI | GitHub Actions, one required workflow | `.github/workflows/ci.yml`, steps in the §5 order |

### Deviations, each recorded rather than silent

| Concern | §5 says | What exists | Why |
|---|---|---|---|
| Token pipeline | `style-dictionary` | A bespoke pipeline (`packages/tokens/scripts/`) | ADR-002. The emitted contract is "hex then `oklch()` behind `@supports`", which `style-dictionary` cannot express; a transform plugin to fake it was more code than the pipeline. |
| Bundle budgets | `size-limit` | `scripts/measure-bundle.mjs` | ADR-010. Budgets are per-component and per-theme, which `size-limit`'s entrypoint model does not express, and the measurement must throw when it finds nothing to measure. |
| Dependency hygiene | `knip` | Not used | Absent, not replaced. §5 itself schedules it as a non-blocking job that "becomes blocking once the workspace is clean"; the workspace has never been run through it. |
| Storybook | Storybook 9, React renderer first | Not used | Absent. §10's workshop is unbuilt; `plan.md` §17 records it as a Tier 1 blocker. |
| Docs site and search | Astro + Pagefind | Not used | Absent. ADR-006 is unwritten and the site is unbuilt. |
| CLI | Node with `cac` and `kleur` | Not used | Absent. `packages/cli` does not exist. |
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
  **Core-tier** project does not; the Core tier is exercised by *device
  emulation inside the existing projects* where a component needs it (Icon
  Button's square target, for example), not by a fourth project. ADR-019 adds a
  `visual` project on top of these, which is a test-layer addition rather than a
  browser-tier one.

### The rule this ADR exists to hold

**No additional linter is added without an ADR.** ESLint plus Prettier plus
TypeScript covers linting, formatting, and types; a second linter is a decision
that needs a record, not a dependency that needs installing. `eslint.config.js`
cites this ADR for that rule.

## Consequences

- The four absent tools are *absences*, not decisions with an alternative. Each
  one is either a Tier 1 blocker (`plan.md` §17) or scheduled work; none of them
  is "done differently", and this table must not be read as if it were.
- A new tool added to the workspace without an entry here is a deviation from
  §5. The remedy is an ADR, and for a linter it is required rather than
  encouraged.
- Replacing an adopted tool means updating this table and the ADR that justified
  the original choice (ADR-002 for tokens, ADR-010 for budgets).

## What would reverse this

Nothing about the adopted column is contested. The deviations reverse as the
work lands: `knip` becomes relevant once the workspace is worth sweeping,
`cac`/`kleur` when the CLI ships, Astro when the docs site does, Storybook when
§10 is built. Each of those brings its own ADR where the plan already calls for
one (ADR-006 for docs, ADR-015 for the AI/MCP surface).
