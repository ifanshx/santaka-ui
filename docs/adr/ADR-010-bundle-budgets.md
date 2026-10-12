# ADR-010: Bundle budgets and how they are enforced

- **Status:** Accepted (amends the token theme budget set in the neo-brutalist
  and glass token work)
- **Date:** 2026-10-12
- **Related:** ADR-017, which is what made the change necessary

## Context

`plan.md` §12 sets four budgets and states they are release gates, not
aspirations: "CI fails the build when a budget is exceeded." It also sets the
rule for exceeding one: "A regression beyond the budget requires an explicit PR
note explaining why, or a budget change recorded as an ADR."

Three of those budgets are measured today by
`packages/web-components/scripts/measure-bundle.mjs`. A fourth —
`@santaka-ui/tokens + @santaka-ui/core` at ≤ 8 KB — has no measurement yet.

Adding the neo-brutalist and glass token layer (ADR-017) pushed the token theme
row from 9.33 KB to 12.22 KB against its 12 KB budget.

## Decision

The token theme budget moves from **12 KB to 13 KB**. The other two measured
budgets are unchanged.

| Artifact | Budget | Measured |
|---|---|---|
| web-components runtime | 12 KB | 8.91 KB |
| component CSS, per component | 4 KB | 2.83 KB |
| token themes, light + dark | 13 KB (was 12) | 12.21 KB |

## Evidence: the growth is the token surface, not a regression

The delta is the deliberate token surface from ADR-017: the brutal shadow ladder
(`brutal`, `brutal-hover`, `brutal-active`, `brutal-none`), the arcade and glass
motion pairs, the glass alpha group, the four per-theme `*-subtle` badge fills,
`color.shadow`, and the display type steps.

## Evidence: the assumed saving is not real

The implementation plan's contingency was to strip the per-token `$description`
comments from the emitted CSS, on the assumption that they ship as bytes. They do
not. `measure-bundle.mjs` minifies through esbuild before measuring, and esbuild
strips comments:

```
light.css          minified 6241 bytes
light.css, no comments
                    minified 6241 bytes
```

Trimming the descriptions would have recovered **zero** bytes while losing the
token documentation §6 requires every semantic token to carry. The budget was
raised instead, and the descriptions stayed.

## How the budgets are measured

- **Runtime** — bundles the entrypoint through esbuild with a fixture that
  *uses* what it imports. A bare `import "pkg"` measures nothing, because
  tree-shaking correctly deletes an unused import.
- **Component CSS** — measured **per component**, minified bytes divided by the
  component count. A single total grows with every component shipped and says
  nothing about whether any one of them is oversized, which is the question a
  per-component budget should answer.
- **Token themes** — the minified bytes of both compiled themes, which is what
  the browser downloads.

## Consequences

- **The budget row is now 1.5 KB of headroom, not 0.** A future token addition
  up to 13 KB ships without a PR note. A larger addition needs one.
- **`@santaka-ui/tokens + @santaka-ui/core` at ≤ 8 KB is still unmeasured.**
  The script measures the compiled theme CSS, not the token package's JS or the
  core registry runtime. That budget is enforced on paper only, which is a gap
  worth closing before the CLI ships — the registry is what CLI commands load.

## What would reverse this

A measured regression rather than a design addition: the same token names
resolving to larger values, or a component stylesheet growing past the
per-component budget. Both are already gates and would fail the build rather
than needing this ADR revisited.