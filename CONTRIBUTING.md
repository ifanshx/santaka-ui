# Contributing to Santaka UI

Thanks for helping build Santaka. This document is the short version; `plan.md`
is the source of truth for what the project is and why.

## Setup

Requirements: Node.js **22.11.0 or newer** and pnpm **10**, both pinned by
`packageManager` in the root `package.json`. Corepack installs the right pnpm for
you:

```bash
corepack enable
pnpm install
```

## The loop

```bash
pnpm run verify
```

That one command runs everything CI runs, in order: format check, lint,
typecheck, tests, build, bundle budgets, and package validation. If it passes
locally, it passes in CI — there is no second set of rules.

Useful subsets while you work:

| Command | What it does |
|---|---|
| `pnpm run test` | Unit and component tests (Vitest) |
| `pnpm run test:e2e` | Browser tests (Playwright) |
| `pnpm run build` | Build every package |
| `pnpm run size` | Measure the bundle budgets in `plan.md` §12 |
| `pnpm run docs:tokens` | Rebuild tokens only, with the contrast report |

## Definition of Done

A component is not done until it satisfies section 7 of `plan.md`. The short
version:

- Typed public API that follows the conventions in section 4.
- All variants and sizes, plus disabled, loading, error, and read-only states
  where meaningful.
- Keyboard behavior, focus management, and an accessible name.
- Light and dark themes, responsive behavior, and reduced-motion handling.
- A 44×44 CSS px minimum hit target, including icon-only controls.
- RTL: authored with logical properties, with a visual regression case.
- Storybook stories, tests, and an accessibility pass.
- A named behavior owner.

Tier 1 components must reach this in two working days; Tier 2 interactive
components in five. A component that keeps exceeding that is a scope signal, not
a discipline problem — split it, defer it, or use a specialist library.

## Architecture decisions

Anything that would be expensive to reverse gets an ADR under `docs/adr/`,
written as context, decision, evidence, and what would reverse it. The table in
section 18 of `plan.md` lists which decisions are already recorded and when
each is due. New ADRs go in the same table.

Two decisions constrain almost every change:

- **One behavior owner per component.** The universal Web Components package
  owns behavior by default. Where Radix supplies it for React, the Web
  Components implementation must match or the divergence must be documented —
  undocumented divergence blocks the Stable label.
- **Scoped styles, not Shadow DOM** (ADR-011). Styling hooks are `data-slot`
  attributes. If a rule needs to reach a component's internals from outside,
  that is what `data-slot` is for.

## Pull requests

- Two approvals for changes to component behavior, public props, or the token
  contract. One approval for docs and test-only changes.
- A changeset on every publishable change. CI fails without one.
- Public API changes start as an RFC issue, so a breaking prop change is not
  discovered during review.

## Commit and release

Conventional Commits drive Changesets. `0.x` releases may break; `1.0.0` waits
for the release gates in section 17 of `plan.md`. Publishing happens from CI
only.

## Code of Conduct

`CODE_OF_CONDUCT.md` adopts Contributor Covenant 2.1 verbatim. By participating
you agree to it.

## Reporting a security issue

Do not open a public issue. See `SECURITY.md` for the private channel and the
response window.