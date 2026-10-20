# ADR-025: Tailwind CSS v4 and Phosphor Icons are deferred integrations

- **Status:** Accepted
- **Date:** 2026-10-19
- **Plan reference:** `plan.md` §4 "Styling strategy" and "Icons", §5 "Suggested Monorepo"

## Context

Two integrations named in `plan.md` do not exist in the repository, and an audit
found both absences were undocumented — so a reader diffing the plan against the
tree could not tell whether either was a decision or an oversight. That is the
failure ADR-018 exists to prevent for tooling, and the same rule applies here.

**Tailwind CSS v4.** §4 asks for an "optional Tailwind CSS v4 utilities/plugin or
integration helpers", explicitly *without forcing* consumers onto Tailwind, and
§5's tree names a `packages/tailwind/` package. No `packages/tailwind` exists
and the word "tailwind" appears nowhere in `packages/`, `apps/`, or `examples/`.

**Phosphor Icons.** §4 says "provide Phosphor Icons integration for supported
framework packages", preferring per-icon imports, and §5 names
`packages/icons/`. Neither exists; components that need a glyph draw it in CSS
(for example `sk-alert`'s icon is an empty `<span>` with `aria-hidden`), and no
package depends on `@phosphor-icons/react`.

There is a third fact that makes the Tailwind absence more than an omission:
**§4 derives the Baseline browser tier from Tailwind's own floor** —
"Baseline is set by Tailwind CSS v4's own floor, so a project can adopt the
optional Tailwind integration without dropping support." So the numbers 111 /
128 / 16.4 are currently justified by a dependency that is not in the tree.

## Decision

**Both are deferred to v1.x, and both deferrals are recorded rather than
silent.** Neither is needed by any shipped component, and shipping either now
would add a public surface with no consumer to constrain its shape — the same
argument ADR-024 makes about a locale API.

### Tailwind CSS v4

- **Not shipped, and not implied.** Documentation must not describe a Tailwind
  integration, and no package may list a Tailwind dependency, until
  `packages/tailwind` exists.
- **The browser baseline is re-justified, not left hanging on a dependency that
  is absent.** Baseline (Chromium 111 / Firefox 128 / Safari 16.4) is retained,
  but the reason recorded is now the feature set it implies — cascade layers,
  `@property`, `:is()`/`:where()`, logical properties, `color-mix()`, `oklch()`,
  `aspect-ratio`, `gap`, native `<dialog>` — which is what the components
  actually use. Should Tailwind later be adopted, its floor coincides with that
  feature set, so the numbers do not move either way. This removes the circular
  dependency without changing a single supported version.
- **The styling contract stays CSS custom properties.** §4's framework-neutral
  contract is tokens, and making Tailwind optional is only coherent if the
  prebuilt-CSS path is complete on its own. It is: `@santaka-ui/tokens/css` and
  `@santaka-ui/styles` ship standalone, and §2's non-goal — "requiring consumers
  to adopt Tailwind just to use prebuilt CSS or Web Components" — holds.

### Phosphor Icons

- **Not shipped as a dependency.** Components keep drawing the few glyphs they
  need in CSS, and any meaningful icon carries an accessible name from the
  consumer (`sk-icon-button`'s `label`, `sk-badge`'s `statusLabel`).
- **No package may add an icon dependency without superseding this ADR.** The
  reason is §4's own constraint: "do not require the React icon package in
  non-React integrations". A React-only icon dependency adopted for one
  component would violate the framework-neutral contract in Layer A, which is a
  harder problem to undo than to avoid.
- **A web-appropriate strategy is required first.** Tree-shakeable per-icon
  imports, weight and sizing conventions, and decorative-versus-meaningful
  semantics all need deciding, and §4 asks for them to be *documented*. None is
  documented today because none is needed today.

## Consequences

- Two plan sections now have a recorded state instead of a silent gap. The
  browser baseline's justification no longer references an absent dependency.
- A consumer can still adopt Tailwind themselves: the components are styled by
  scoped CSS with `data-slot` hooks (ADR-011) rather than a shadow root, so
  utility classes reach component internals — which is precisely the property
  that makes a future Tailwind integration a thin layer rather than a rewrite.
- If `packages/tailwind` or `packages/icons` is ever created, this ADR must be
  superseded first. Creating either directory without updating it is the drift
  the framework-matrix check already prevents for adapters, and the same
  reasoning applies.

## What would reverse it

- **Tailwind:** a consumer need that CSS custom properties cannot serve — most
  likely a request for a `@theme` bridge or a utility layer generated from the
  token set. That is a v1.x feature, not a v1.0 blocker, because nothing in the
  shipped component set requires it.
- **Icons:** a shipped component needing a real icon set rather than a drawn
  glyph. `sk-icon-button` is the closest candidate, and it deliberately takes
  the icon as slotted consumer content while owning only the accessible name, so
  the need has not arisen.
