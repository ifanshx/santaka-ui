# ADR-023: Two plan budgets were measured for the first time, and one could not be met

- **Status:** Accepted (amends `plan.md` §12's ten-component budget; supersedes the
  "unmeasured" gap in ADR-010)
- **Date:** 2026-10-17
- **Plan deadline:** `plan.md` §12 ("Performance budgets")
- **Related:** ADR-010 (the budget table and its headroom rule)

## Context

`plan.md` §12 lists four budgets and calls them release gates. ADR-010 recorded
that three were measured and one — `@santaka-ui/tokens + @santaka-ui/core` at
≤ 8 KB — was not, and left it as an open gap. `packages/react` had no size script
at all, so the fourth row had never been measured either.

Two of those rows were added to `packages/web-components/scripts/measure-bundle.mjs`
in this change. The first measurement of one of them failed, and the reason was
not the budget.

## Decision 1: `core` stops shipping Ajv

`validateRegistryItem` constructed an `Ajv2020` instance and compiled the schema
at module load. Bundled and gzipped, `@santaka-ui/core` measured **41.2 KB** —
against a row whose whole budget is 8 KB. Every `santaka` command loads that
module, and the schema it validates against cannot change at runtime.

The validator is now compiled at build time by
`packages/core/scripts/build-validator.mjs`, using Ajv's own standalone code
generator, and `ajv` moved from `dependencies` to `devDependencies`. The emitted
module is bundled with esbuild because Ajv's ESM output still `require`s its
`ucs2length` runtime helper — a genuine CommonJS hole in an otherwise-ESM file.

| | before | after |
|---|---|---|
| `@santaka-ui/core` | 41.2 KB | **4.4 KB** |
| `tokens + core` | — | **7.44 KB** of 8 KB |

The schema remains the single source of truth: the generator reads the same
`registry-item-schema.ts`. `validate-item.test.ts` and the 157 registry tests are
the proof that behavior did not change, not the claim that it did not.

**This is not a budget change.** The row was always 8 KB; it had simply never
been measured, and measuring it exposed a real defect.

## Decision 2: the ten-component row is gated at 27 KB, not 25 KB

The row as written — `tokens` + `core` + any 10 components ≤ 25 KB — **cannot be
met by any selection of ten components.**

| Measurement | KB |
|---|---|
| 10 smallest stylesheets | 10.63 |
| the runtime those ten share | 12.35 |
| one theme (`light.css`) | 3.07 |
| **`tokens + any 10 components`** | **25.76** (verified floor over candidate selections) |
| **+ `core`** | **30.19** |

The cost is not dominated by any single component. The shared base that even one
component pulls in is ~8.4 KB of Stencil runtime; the cheapest ten stylesheets
are ~10.6 KB; the theme is ~3.1 KB. No choice of ten brings the total under 25 KB.

Three options were considered:

1. **Raise the number until it passed, keeping `core` in the row.** Rejected. At
   ~30 KB the gate would be binding only for the cheap end of the selection and
   inert for the expensive end, which is a gate in name only.
2. **Leave it failing.** Rejected. A permanently red gate on a correct tree
   teaches everyone to ignore the size check.
3. **Gate the part that can actually fail, and report the rest.** Chosen.

The gate is `tokens + any 10 components` at **27 KB**: the 25.76 KB floor with the
~4% headroom ADR-010 established as this table's rule, so it fails on a
regression rather than on the next component. `core` is left out of this row
because it is not a runtime dependency of these components — `web-components`
declares only `styles`, `tokens`, and `utilities` as peers — and it is measured in
its own row above. Both readings that name it are still printed, marked `info`
and never gated.

**This is a budget change, and §12 requires an ADR for one. This is that ADR.**

## What is still unmeasured

`@santaka-ui/react` runtime overhead (≤ 15 KB) has no size script. `packages/react`
is a thin wrapper over the custom elements and has no `size` task, so the row
remains unmeasured rather than passing. It is not claimed anywhere as met.

## Consequences

- The size check now fails when the ten-component selection regresses past 27 KB,
  verified by lowering the budget to 20 KB and observing exit 1.
- The measurement prints two informational rows that no gate reads. They exist to
  make the trend visible: the ten largest components currently read 54.54 KB, and
  that number is the reason the surface should be watched rather than a promise
  about it.
- `ajv` is no longer installed for consumers of `@santaka-ui/core`. Anyone
  depending on it transitively through this package loses it, which is the
  intended effect and is a breaking change only if it was never supported — it
  was not, since it was an implementation detail of one function.
- The ten-component selection sorts on stylesheet size alone and is not a proven
  minimum; a search over selections finds 25.76 KB against the selection's
  26.06 KB. The 0.30 KB gap sits below the budget either way, and the script's
  comment says so rather than claiming a minimum it does not compute.
