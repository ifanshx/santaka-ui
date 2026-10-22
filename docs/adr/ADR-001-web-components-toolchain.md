# ADR-001: Web Components authoring toolchain

- **Status:** Accepted
- **Date:** 2026-10-12
- **Specification:** §4 of [ARCHITECTURE.md](../ARCHITECTURE.md)

## Context

`docs/ARCHITECTURE.md` §4 Layer B names Stencil as the default for authoring the universal
Web Components package, with a time-boxed comparison against **Lit** allowed to
override it — but only with a written ADR recording bundle-size evidence,
SSR/hydration behavior, and the reason for changing course. The plan is explicit
that both toolchains must not be carried.

The time box was: "If no decisive evidence appears within the box, keep Stencil
and move on." The comparison below is the record of that box being closed.

## Evidence

The comparison ran against the one component that decides it — a
form-associated, keyboard-interactive control rather than a static element.

| | Stencil 4.45.2 | Lit 3.x |
|---|---|---|
| Form association (`attachInternals`, `setFormValue`) | Built in: `formAssociated: true` plus `ElementInternals` | Hand-written; the Elements Experience polyfill or a manual shim |
| Lazy loader for SSR | Generated (`esmLoaderPath`), consumed by React and Vue adapters | Hand-written |
| Scoped styles (ADR-011) | `scoped: true` emits attribute-scoped CSS with no runtime | `createRenderRoot()` returning `this`, same idea, manual |
| Runtime shipped to a consumer | 8.91 KB gzipped, measured per import | Comparable |
| Typings | Generated `components.d.ts` with `HTMLElement` interfaces | Hand-written or generated separately |
| Documentation output | `docs-json` + `docs` for custom-elements manifest | Hand-written |

Two of these are decisive rather than merely convenient. Form association is
mandatory by `docs/ARCHITECTURE.md` §4's forms contract, and Stencil's generated typings are
what let the React package type its adapters against the real element type
(`SkButtonElement`, `HTMLButtonElement`) without a second hand-maintained
declaration file.

The cost is real and is recorded here rather than glossed: Stencil emitted
**358 KB of CommonJS** that the package could not use, because `OutputTargetDist`
has no option to suppress it and the exports map named only ESM entrypoints.
That is now stripped in the build (`scripts/strip-cjs-output.mjs`). Lit would
not have shipped it, so this is a genuine point against Stencil — and it was not
decisive, because the defect was fixable in one script and the alternative's
cost was reimplementing form association.

## Decision

**Stencil.** One toolchain, no Lit.

## Consequences

- Two build scripts exist purely to correct Stencil output
  (`fix-declaration-specifiers.mjs`, `strip-cjs-output.mjs`). Both are documented
  with why Stencil cannot be configured to do it, and both fail loudly rather
  than silently skipping.
- A Stencil major upgrade must re-run `attw --pack`, which is what catches a
  change in the generated declaration specifiers.

## What would reverse this

A Stencil version where form association or scoped styles regress, or a Lit
release that ships first-class form-associated custom elements with generated
typings. The reversal is one toolchain swap plus one ADR; carrying both is
explicitly out of scope.