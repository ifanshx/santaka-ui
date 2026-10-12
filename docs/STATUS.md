# Implementation status

Verified against `plan.md` on 2026-10-12. This is a status readout, not a plan:
`plan.md` is the plan, `docs/adr/` records the decisions, and this file records
what exists today. Every claim below is checked against the repository.

## Summary

Weeks 1–4 of the roadmap. The token layer and the universal Web Components
package are real, tested, and green; the React package now covers all four
shipped components; the CLI, registry hosting, documentation site, and Storybook
do not exist yet.

`pnpm run verify` exits 0 from a cold cache. **196 tests pass.** All six
packages pass `publint` and `attw --pack`.

## Done

### Token layer

- DTCG source of truth compiled to CSS custom properties, light and dark.
- The build fails on an unknown token reference or a contrast pair below its
  target, and writes a contrast report. 25 pairs gated, all passing.
- Every color emitted twice — hex then `oklch()` behind `@supports` — so a
  Core-tier browser renders the intended color.
- **48 tests**: 28 pipeline math, 20 theme-contract relationships. The contract
  tests cover what a build cannot: a token is only wrong relative to the theme it
  renders in.

### Components

Four universal custom elements, each with browser tests against real Chromium:

| Component | Notable coverage |
|---|---|
| `sk-button` | form participation, keyboard, 44px target, RTL, theme, brutalist geometry measured in-browser |
| `sk-icon-button` | accessible name, square hit target on **both** browser tiers, spinner |
| `sk-link` | anchor semantics, external indicator, theme |
| `sk-badge` | variant fills from tokens (not `color-mix`), dot label for WCAG 1.4.1 |

**54 Playwright tests.** All four carry the brutalist treatment — 3px stroke,
`border-radius: 0`, zero-blur offset shadow — with the press measured in a
browser: hover lifts to `-2px -2px` with a `7px 7px` shadow, press moves to
`3px 3px` with `2px 2px`.

### React package

`Button`, `IconButton`, `Link`, `Badge`, plus `ThemeScript` / `useTheme`. **42
tests.** Badge's adapter enforces the WCAG 1.4.1 requirement in the type
system: `<Badge dot />` does not compile without `statusLabel`.

### Core and utilities

- Registry JSON Schema, validation of untrusted entries, checksums verified
  against shipped files.
- `validate`, `cn`, `id` — 20 tests.
- **5 exports-contract tests** asserting every stylesheet a package builds is
  reachable through `exports`, and every export resolves to a file that exists.

### Distribution

- **ESM only.** 358 KB of unreachable CommonJS removed; Stencil has no option to
  suppress it, so the build strips it and verifies the ESM entrypoints survived.
- **`attw --pack` on every package.** It found a real defect on introduction:
  Stencil emits `export * from '../types'` into its declarations, a directory
  specifier with no file extension, so the published types did not resolve under
  `node16`. Fixed in the build.
- `glass.css` is reachable as a standalone import, not only through `index.css`.

### Tooling

pnpm 10 + Turborepo, three-job CI, Changesets, TypeScript strict, ESLint, Prettier,
measured budgets.

### Decisions recorded

**8 of 18 ADRs exist**: 001 (Stencil over Lit, with evidence), 002 (token
pipeline, and why `style-dictionary` is not used), 004 (naming, scope, license),
005 (SSR and hydration), 010 (budgets), 013 (API conventions, one question
open), 014 (browser baseline), 017 (token values and design direction).

## Not done

### Blocking Tier 1

- **Card, Typography, Separator, Spinner, Skeleton, Input, Textarea, Label** —
  eight of the twelve Tier 1 components do not exist.
- **No Storybook.** Section 10's workshop; nothing in the repo references it.

### Blocking Stable

- **10 ADRs missing**: 003, 006, 007, 008, 009, 011, 012, 015, 016, 018.
  ADR-002, ADR-005, and ADR-011 were cited from source comments before this pass;
  those citations now resolve.
- **No Next.js SSR proof.** Risk R2 rates this a weeks 1–2 item. The strategy is
  decided in ADR-005; the proof is not done, so no integration may claim SSR.
- **No visual regression in RTL.** Section 17 requires it per component. Only
  Button has an RTL test, and it is an interaction test, not a visual one.
- **No `axe-core`.** ADR-008 is unwritten and no automated accessibility check
  runs.
- **No legal preconditions.** Trademark, npm scope, domain, mascot originality.
- **No consumer fixture.** `attw` and `publint` validate the packed tarball, but
  nothing installs the package into a scratch project and imports it.

### Unmeasured

- **`@santaka-ui/tokens + @santaka-ui/core` at ≤ 8 KB has no measurement.**
  `measure-bundle.mjs` measures compiled theme CSS, not the token package's JS or
  the core registry runtime. Recorded in ADR-010 as a gap.

### Toolchain deviations

Section 5 names four tools this repository does not use: `style-dictionary`
(reason in ADR-002), `size-limit` (replaced by `measure-bundle.mjs`, ADR-010),
`knip`, and `axe-core`. Two are recorded as decisions; two are simply absent.

### Known gaps in what shipped

- **Seven tokens have no consumer yet**: `text.display`, `text.display-sm`,
  `glass.bg-strong`, `radius.glass-lg`, `duration.overlay`, `ease.glass`,
  `duration.instant`. They are for Tier 2. The consequence is that `glass.css`
  has never been exercised end-to-end by an overlay that uses the glass easing.
- Two build scripts exist only to correct Stencil output
  (`fix-declaration-specifiers.mjs`, `strip-cjs-output.mjs`). Both document why
  Stencil cannot be configured to do it, and both fail loudly rather than
  silently skipping.

## Open decision

ADR-013 leaves one question unresolved: whether a boolean that toggles a
*presentation* rather than a state takes the `is`/`has`/`can` prefix. Three
shipped props sit on it — `sk-link.external`, `sk-link.subtle`, `sk-badge.dot`.
The conformance test enumerates them by name, so a new unprefixed presentation
boolean fails rather than inheriting the ambiguity.