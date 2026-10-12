# ADR-005: SSR and hydration strategy for the universal package

- **Status:** Accepted
- **Date:** 2026-10-12
- **Plan deadline:** end of weeks 3–4 (`plan.md` §18)

## Context

Web Components are defined by the browser, so a custom element tag in server
output is inert HTML until something calls `customElements.define`. Two failure
modes follow, and `plan.md` risk R2 rates the second as the one that makes
support-matrix claims false:

- **R3, flash of unstyled content.** Closed by ADR-011 — scoped styles arrive in
  the document payload with the markup, so there is no shadow-root styling
  boundary to wait for.
- **R2, hydration mismatch.** A server pass emits `<sk-button>`. If the server
  bundle eagerly defines the element, the tag upgrades during SSR and the
  client pass sees a different tree than the server produced.

## Decision

**Two documented registration paths, chosen by the consumer, with the eager path
as the default and the lazy path for SSR.**

### Eager — the default

```js
import "@santaka-ui/web-components"
```

Registration comes from Stencil's `customElementsExportBehavior:
"auto-define-custom-elements"`, not from a side effect in the source. This is the
documented path for plain HTML, and for React, Vue, Svelte, and Angular where
the tag is known at build time.

### Lazy — for SSR

```js
// server: render the tag, do not define it
// client:
import { defineCustomElements } from "@santaka-ui/web-components/loader"
defineCustomElements(window)
```

The lazy loader defers definition until client code calls it, so hydration
compares like-for-like: the server's inert tag and the client's inert tag.

**SSR frameworks that render the tag during a server pass should use the loader
path, not the eager one.** This is stated in `packages/web-components/src/index.ts`
at the entrypoint itself, because it is the decision most likely to be got wrong
by someone reading only the README of the package they depend on.

## Consequences

- **The Next.js SSR proof is not done.** `plan.md` §15 Weeks 1–2 requires proving
  scoped styles and lazy registration under Next.js SSR *before* committing to
  them, and §18 assigns this ADR to weeks 3–4. The strategy is decided here; the
  proof is an open item and the support matrix must not claim SSR support until
  it exists.
- Stencil's generated loader needed a correction before it resolved at all: it
  emitted `export * from '../dist/types/components'`, a directory specifier with
  no entry file, so the loader's types did not resolve under `node16`. Fixed in
  the build by `scripts/fix-declaration-specifiers.mjs` and verified by
  `attw --pack`.
- The loader ships ESM only. Its CommonJS sibling is removed in the same build
  step, because the exports map names only ESM and unreachable formats are dead
  weight (ADR-012).

## What would reverse this

If a framework's adapter can register custom elements during SSR without
producing a different tree — for instance if Stencil's hydrate output proved
sufficient — the lazy path could become advisory rather than required. The
decision is cheap to revisit before 1.0 and expensive afterwards, because
consumers encode the choice in their bundler config.