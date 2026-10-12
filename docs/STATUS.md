# Implementation status

Verified against `plan.md` on 2026-10-12. This is a status readout, not a plan:
`plan.md` is the plan, `docs/adr/` records the decisions, and this file records
what exists today. Every claim below is checked against the repository rather
than against a plan checkbox.

## Summary

Weeks 1–4 of the roadmap. The token layer and the universal Web Components
package are real, tested, and green; the React package covers three of four
components; the CLI, registry hosting, documentation site, and Storybook do not
exist yet.

`pnpm run verify` exits 0 from a cold cache. All three measured budgets pass.

## Done

### Token layer

- DTCG source of truth compiled to CSS custom properties, light and dark.
- The build fails on an unknown token reference or a contrast pair below its
  documented target, and writes a contrast report alongside the themes.
- Every color is emitted twice — a hex declaration then the `oklch()` value —
  so Core-tier browsers render the intended color.
- 25 contrast pairs gated, all passing. The `color.shadow` gate is light-only:
  a hard offset shadow only darkens, so it cannot meet 3:1 against a dark
  surface in either direction (ADR-017).
- Theme contract tests in `packages/tokens/scripts/tokens.test.ts` (20 tests)
  cover the *relationships between tokens* — the invariants a build cannot check
  because a token is only wrong relative to the theme it renders in.

### Components (universal Web Components)

Four components ship, each with a browser test suite against real Chromium:

| Component | Notable coverage |
|---|---|
| `sk-button` | form participation, keyboard, 44px target, theme, brutalist geometry measured in-browser |
| `sk-icon-button` | accessible name, square hit target on **both** browser tiers, spinner |
| `sk-link` | anchor semantics, external indicator, RTL, theme |
| `sk-badge` | variant fills from tokens (not `color-mix`), dot label for WCAG 1.4.1 |

All four carry the brutalist treatment — 3px stroke, `border-radius: 0`,
zero-blur offset shadow — with the press interaction measured in a browser:
hover lifts to `-2px -2px` with a `7px 7px` shadow, press moves to `3px 3px`
with `2px 2px`.

### React package

`Button`, `IconButton`, `Link`, plus `ThemeScript` / `useTheme`. 36 unit tests.

### Tooling and contracts

- `@santaka-ui/core` publishes the registry JSON Schema, validates untrusted
  entries before anything is written, and generates registry metadata for all
  four components with checksums verified against the shipped files.
- `@santaka-ui/styles` validates that every `var(--sk-*)` reference in its
  stylesheets resolves to a defined token, and ships `glass.css` for the Tier 2
  floating components.
- Budgets measured per component, not as a package total (ADR-010).

### Decisions recorded

`docs/adr/` now holds ADR-010 (budgets), ADR-013 (API conventions, one question
open), ADR-014 (browser baseline), and ADR-017 (token values and design
direction).

## Not done

Ordered by what blocks the next milestone.

### Blocking Tier 1

- **Card, Typography, Separator, Spinner, Skeleton, Input, Textarea, Label.** The
  remaining eight Tier 1 components. None exist.
- **No React adapter for Badge.** The universal package ships it; React does not.
  This is a parity gap inside the "agreed core subset" for weeks 3–4.
- **No Storybook.** Section 10's workshop does not exist. Nothing in the repo
  references it.

### Blocking Stable

- **Missing ADRs.** ADR-001, ADR-002, ADR-004, ADR-005, ADR-012, ADR-016, and
  ADR-018 have no file. Three of them — ADR-002, ADR-005, ADR-011 — are already
  cited from source comments, so the references dangle.
- **No Next.js SSR proof.** Risk R2 says to test this in weeks 1–2, not week 11.
  Untested.
- **No visual regression in RTL.** Section 17 requires it per component; only
  four interaction test files exist. Section 6 RTL is otherwise clean: no banned
  physical properties anywhere in component source.
- **No axe-core pass.** ADR-008 is not written and no automated a11y check runs.
- **No legal preconditions.** Trademark search, npm scope, domain, mascot
  originality — all unverified (section 13).

### Unmeasured

- **`@santaka-ui/tokens + @santaka-ui/core` at ≤ 8 KB has no measurement.**
  `measure-bundle.mjs` measures the compiled theme CSS, not the token package's
  JS or the core registry runtime. This budget is enforced on paper only, and
  the registry is what CLI commands will load.

### Known gaps in what shipped

- **Nine new tokens have no consumer yet:** `text.display`, `text.display-sm`,
  `glass.bg-strong`, `radius.glass-lg`, `duration.overlay`, `ease.glass`,
  `duration.instant`. They are for Tier 2. The consequence is that `glass.css`
  has never been exercised end-to-end by an overlay that actually uses the glass
  easing — its entrance animation is defined and unreferenced.
- **The registry example at `plan.md` line 728 still cites `--sk-radius-md`**,
  which no longer exists as a value.
- **`.changeset/` carries the release notes** for the design change; the ADR for
  the budget change lives at `docs/adr/ADR-010-bundle-budgets.md` rather than in
  the changeset, which is where section 12 points.

## Open decision

ADR-013 leaves one question unresolved: whether a boolean that toggles a
*presentation* rather than a state takes the `is`/`has`/`can` prefix. Three
shipped props sit on it — `sk-link.external`, `sk-link.subtle`, `sk-badge.dot`.
The conformance test enumerates them by name, so a *new* unprefixed presentation
boolean fails rather than slipping through. The ADR recommends prefixing them
and records the argument against.