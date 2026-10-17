# ADR-011: CSS encapsulation — scoped styles, never a shadow root

- **Status:** Accepted
- **Date:** 2026-10-12
- **Plan deadline:** end of weeks 1–2 (`plan.md` §18)

## Context

`plan.md` §4 Layer B lists "CSS encapsulation" among the decisions that must be
recorded, and the choice is between Stencil's two modes: a **shadow root**
(`shadow: true`, the platform's own encapsulation) or **scoped styles**
(`scoped: true`, an attribute stamped onto every element the component renders,
with the CSS rewritten to match).

The decision is load-bearing because it is not really about encapsulation. It is
about what a consumer is allowed to do to a component's internals, and it is
cited from source in fourteen files — the README, CONTRIBUTING, the Stencil
config, and the components themselves. Those citations resolved to nothing until
this record existed, which is the debt this ADR closes.

## Evidence

**A shadow root hides the component from every consumer stylesheet.** That is
its purpose, and it is the wrong purpose here. A shadow boundary is opaque to:

- **Consumer utility classes.** `class="sk-button mt-4"` — the Tailwind (or any
  other) utility applies to the host element, but any rule that tries to reach an
  internal node (a label, a slot, a wrapper) matches nothing. This is the single
  most common way a consumer's `className` "does nothing", and it is silent.
- **Consumer overrides.** The documented styling hooks are `data-slot`
  attributes (ADR-013). A consumer writing `sk-button [data-slot="label"] { … }`
  can only win if those nodes are in the light DOM.
- **The scoped-CSS build itself.** `scripts/build-css.mjs` concatenates plain
  `.css` files into one stylesheet the consumer imports explicitly. That only
  works if the selectors are addressable from the document.

**Scoped mode has a real cost, and it is recorded rather than hidden.** Scoped
mode strips the `<slot>` element and relocates the assigned nodes into its place.
A selector of `slot[name="footer"]` therefore matches **nothing**, and its rules
silently never apply — no error, no warning, just a style that was never drawn.
The first version of `sk-card.css` styled its footer separator exactly that way.
The consequence is a rule for authors, not a reason to change the decision:
everything that must be styled hangs off a real wrapper element, and
`e2e/card.e2e.ts` asserts no `sk-card slot` exists in the light DOM so the next
author to reach for a slot selector finds out immediately.

**Scoped mode is one half of how FOUC is closed, and the halves should not be
conflated.** ADR-005 attributes risk R3 (flash of unstyled content) to this
decision, and that is correct but incomplete on its own: the *reason* scoped
styles remove the flash is that there is no shadow-root boundary for the
document stylesheet to cross, so the CSS in the document payload styles the
markup the moment the browser parses it. Scoped styles are what make that file
able to address the internals; *shipping it as a file rather than injecting it
from JavaScript* is the other half, and it is a separate decision recorded in
`build-css.mjs`, driven by `plan.md` §4's "no JavaScript injects a `<style>` or
`<link>` tag at runtime". Two decisions, kept distinct, and ADR-005 cites this
one for the boundary half.

## Decision

**`scoped: true` on every component. No shadow root, anywhere.**

Enforced statically: `e2e/conventions.e2e.ts` reads each component's source and
asserts it declares `scoped: true` and does not declare `shadow: true`. A new
component that reaches for a shadow root fails the suite rather than shipping.

## Consequences

- Styling hooks are `data-slot` attributes, not classes, and not shadow parts.
  `::part()` is unavailable by construction; that is accepted.
- Component authors must not write `slot` selectors. The `<slot>` element does
  not survive, and a rule written against it fails silently.
- Consumer utility classes and global overrides reach component internals. This
  is the property the decision was made for.
- The Stencil config's `scoped: true` and this ADR must change together; the
  config comment cites this record.
- *Amended when Svelte support was built (ADR-021):* "renders into the light DOM"
  has a consequence beyond styling. A component that renders into its own light
  DOM mutates the tree a framework is hydrating, so an upgraded element breaks a
  server-rendered page unless the elements are registered **after** hydration.
  Measured in `examples/svelte-vite`: registering first produced
  `HierarchyRequestError` inside Svelte's hydration walk, which Svelte answers by
  discarding the server's markup. The same ordering is why ADR-005 defines the
  elements inside a React effect. Reversing *this* decision — real shadow roots —
  would remove that constraint as a side effect, and it would also remove every
  consumer's ability to style component internals, which is the trade this ADR
  already made.

## What would reverse this

A consumer contract that requires true style isolation — for example, shipping a
component whose internal structure must be unstyleable by the page. That is not
this library's contract: it ships a token system the consumer is expected to
override. Reversal means one config flag, one conformance assertion, and
rewriting every `data-slot` selector as a `::part()`.
