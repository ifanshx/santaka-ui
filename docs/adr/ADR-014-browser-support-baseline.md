# ADR-014: Browser support baseline and Core tier

- **Status:** Accepted
- **Date:** 2026-10-12
- **Related:** ADR-017

## Context

`docs/ARCHITECTURE.md` §4 defines two tiers, tested separately:

| Tier | Meaning | Chrome / Edge | Firefox | Safari | iOS Safari |
|---|---|---|---|---|---|
| Baseline | Full styling, motion, and behavior | 111 | 128 | 16.4 | 16.4 |
| Core | Structure and behavior; degraded styling | 90 | 121 | 15.4 | 15.4 |

It lists what Baseline implies — including `color-mix()`, `oklch()`,
`aspect-ratio`, `@property`, logical properties — and what is "not available in
Core and therefore never used in component CSS", with the rule that anything
improving a component goes behind `@supports` so Core keeps a working fallback.

ADR-017 changed the component styling system. That rule turned out to be
load-bearing, and one violation shipped before it was caught.

## The defect

Icon Button is documented as square: equal inline and block size, so an icon-only
control's hit target matches what is drawn. The 3px brutalist stroke broke it.

An icon-only control's inline size is content-driven — icon plus padding. With a
1px border that overflowed the 44px floor harmlessly. With a 3px stroke the
floor stopped governing it and the control measured **66×50** instead of 44×44:
still above the target minimum on both axes, so the existing 44px test passed,
but no longer square.

The first fix used `aspect-ratio: 1`. That works, and it is Baseline-only —
Core is Chrome 90 / Safari 15.4. A Core browser would have dropped the
declaration and shipped the 66×50 bug again.

## Decision

Two changes, both testable:

1. **`aspect-ratio` is never the only mechanism for a contract.** The fixed
   square sizes are the Core path; `@supports (aspect-ratio: 1)` hands sizing
   back to content on Baseline, where the `size` steps can grow the control
   evenly again. `@supports not (aspect-ratio: 1)` restates the sizes explicitly,
   because a Core browser cannot derive them from padding.

2. **A bordered control declares its own box model.** `sk-icon-button` sets
   `box-sizing: border-box` itself. The fixed sizes are written against
   `border-box`, and the only thing that supplied it was the optional
   `@santaka-ui/styles` reset — a package a consumer is explicitly told they do
   not need (`docs/ARCHITECTURE.md` §4: "a consumer that imports only components still gets
   sane defaults"). Without the reset, a consumer measured a 66×50 box.

## Evidence

`packages/web-components/e2e/icon-button.e2e.ts` asserts both halves:

- **The Core cascade.** `@supports` is resolved at parse time, so a Core browser
  cannot be simulated by neutralizing a property afterward. The test reproduces
  the cascade a Core browser actually sees: the Baseline branch cancelled, the
  Core branch applied.
- **The absent reset.** The test detaches the real
  `packages/styles/dist/index.css` stylesheet rather than injecting
  `box-sizing: content-box !important` — an injected blanket rule outranks the
  very declaration under test and would prove nothing.

## Consequences

- **Icon Button measures 44×44 at `sm` and `md`, and 54×54 at `lg`** on
  Baseline. Previously `lg` reached 66px. The density step survives because
  `aspect-ratio` lets content grow it on both axes; the Core path states fixed
  sizes per step instead (44 / 48 / 56).
- **The rule generalises: a component must not depend on the optional reset for
  its own geometry.** The reset is a convenience, not a dependency. This is worth
  auditing across the components that ship next.

## What would reverse this

Evidence that the Core tier's degraded styling is costing more than the extra
rule is worth. The cheap alternative is dropping Core support for components
where the fix is genuinely awkward — but `docs/ARCHITECTURE.md` §4 is explicit that Core
exists so the prebuilt-CSS path "reach[es] further than Tailwind does", so the
tier is load-bearing for the product's reach claim.