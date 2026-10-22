# ADR-003: Behavior ownership per component family

- **Status:** Accepted
- **Date:** 2026-10-12
- **Specification:** §4 of [ARCHITECTURE.md](../ARCHITECTURE.md)

## Context

`docs/ARCHITECTURE.md` §4's implementation ownership rule exists to stop one failure mode:
paying the full Definition of Done twice for the same interaction model. If the
React package and the universal package each implement their own focus trap, they
drift, and every bug is fixed twice or fixed once and left broken on the other
side. Risk R4 names the consequence — "dual implementation cost silently doubles
every interactive component" — and the mitigation is an ownership rule.

This record is required before the first component of each family ships, and it
was cited from `sk-switch`'s and `sk-checkbox`'s decisions (ADR-013 amendments)
before it existed. It was the last of the foundation ADRs to be written.

## Decision

**The universal Web Components package owns the behavior of every shipped
component. The React package is a thin adapter over it. No component uses Radix.**

### Why this is the uniform answer here

§4 makes Web Components the *default* source of truth and names one exception:
"Where Radix UI supplies behavior for a component, the React package becomes the
owner." That exception does not apply, and the evidence is that **the workspace
has no Radix dependency at all** — not in `packages/react/package.json`, not in
the lockfile, nowhere. The React package's components forward props, attributes,
and events to the `sk-*` custom elements the universal package registers; they do
not re-implement keyboard handling, focus management, or ARIA wiring.

So the default rule is the actual rule, for all twenty-one components, and the
`behaviorOwner` field is uniform by construction rather than by convention.

### How it is enforced

- **Registry metadata.** Every entry in `packages/core/registry/` declares
  `"behaviorOwner": "web-components"`. All twenty-one do. `packages/core`'s
  registry tests validate the field, so a new entry cannot omit it.
- **The adapter is thin by structure.** `@santaka-ui/react` imports the element
  types and forwards to them. Its `./jsx` subpath exists only to type the
  custom elements for JSX, which is a typing concern, not a behavior one
  (ADR-012).
- **The behavior lives in one place.** Form association is in
  `shared/form-control-base.ts`; the dialog behavior is the native `<dialog>`;
  keyboard semantics are in the component. None of it is duplicated in React.

### Documented divergences

There are **none** today, and that is a claim the structure supports rather than
an assertion: the React components are adapters, so there is nothing to diverge.

The nearest thing to a divergence is an adapter-level concern, not a behavior
one, and it is recorded so the distinction is not blurred: React's `Input`
generates its `id` with `useId()` so the id stays stable across re-renders and
label association survives them. The *element* owns label wiring; React owns the
id it passes down. That is the adapter doing its job — typing and ergonomics —
not a second behavior implementation.

## Consequences

- The per-component time budget in §7 is spent once. A React bug that is really a
  behavior bug is fixed in `packages/web-components` and both packages get it.
- A component whose React story needs behavior the element does not expose is a
  signal to extend the element, not to fork behavior into React. The ownership
  rule makes that the path of least resistance.
- Vue, Svelte, and Angular adapters, when they land, are thin by the same rule:
  typing, props/attrs, event ergonomics, and form integration only (§4).
- `behaviorOwner` is per component, not per package, precisely so that a future
  exception can be recorded on one component without rewriting this decision.

## What would reverse this

Adopting Radix for a component whose behavior is expensive to hand-build
correctly — Combobox, Menu, Context Menu, and Autocomplete are the candidates §7
defers to v1.x. Under §4, that component's owner becomes React, and the Web
Components implementation must either match it or declare the divergence in the
component's documentation. Divergence that is not documented is a release
blocker.

The reversal is per component, and it is recorded by changing that component's
`behaviorOwner` and adding the divergence note — not by revising this ADR, which
describes the default that all twenty-one shipped components follow.
