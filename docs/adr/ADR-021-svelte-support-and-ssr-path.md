# ADR-021: Svelte 5 support — the elements are the adapter, and registration follows hydration

- **Status:** Accepted
- **Date:** 2026-10-17
- **Specification:** §3 of [ARCHITECTURE.md](../ARCHITECTURE.md) (Svelte / SvelteKit row) and the release gates in §16

## Context

`docs/ARCHITECTURE.md` §3 lists Svelte as a target with a deliberately unhelpful-looking
instruction — *"Native wrappers where needed and Web Components usage path"* — and
one gate: **"Props/events, SSR and hydration tests."** The words "where needed"
are the decision this ADR has to make. The support matrix
(`docs/framework-support.md`) recorded Svelte as `Planned` with the note that
nothing existed and that a *claimed* integration needs three things: the
wrappers, the example, and the SSR/hydration proof.

Two questions had to be answered with evidence rather than assumption:

1. **Does Svelte need wrapper components at all?** React and Vue both have a
   package that re-exports each component. If Svelte needs the same, Svelte gets
   the same; if it does not, shipping wrappers would be a second place for a prop
   to be renamed and a second surface to keep in sync for no gain.
2. **What happens when the page is server-rendered?** The elements are
   `scoped: true, shadow: false` (ADR-011), so they render into their *light*
   DOM. A framework that hydrates by adopting the server's nodes and a component
   that mutates those nodes are on a collision course, and the collision is not
   visible in any client-only application.

Three earlier decisions constrain the answers: ADR-003 (the element owns its
behavior, so an adapter must not reimplement it), ADR-005 (in React, the elements
are defined in an effect, i.e. after hydration, so the server render cannot see
them), and ADR-011 (scoped styles, no shadow root).

## Decision

### 1. No wrapper components. The package ships types and a theme store.

Svelte 5's template compiler already does what the React and Vue adapters had to
build by hand, and its exact rule is worth stating because it is not the obvious
one. Read in the pinned `svelte` 5.57.2
(`src/internal/client/dom/elements/attributes.js`, `set_custom_element_data`): if
the element is registered, Svelte asks it for the setters it exposes and assigns
the property when there is one, otherwise a stringified attribute; if the element
is **not** registered yet — the state during hydration, before
`defineCustomElements()` runs — it falls back to an object heuristic: an
object-valued prop is assigned as a property, anything else becomes an attribute.
So the route a prop takes depends on *when* it is written, which is why the
example's tests assert both.

They assert the consequences rather than the reading. `options` is checked as the
attribute the server wrote *and* as the property Svelte assigns, with the element
rendering the same three options either way (`props reach the elements and the
element's own events reach the app`); the browser's own `FormData` carries the
values (`submits every named control through the browser's own FormData`); and the
element's own `sk-value-change` event reaches the app through the
`onsk-value-change` binding. The string-valued case follows from the branch above
rather than from a test of its own: a `variant="primary"` write made while
`<sk-button>` is unregistered takes the attribute route, which is the same route
that makes the attributes the *server* wrote meaningful to an element that upgrades
later.

So `@santaka-ui/svelte` exports **no components**. What it exports is the two
things Svelte cannot supply for itself:

- **`@santaka-ui/svelte/elements`** — a types-only subpath (a raw `.d.ts`, copied
  into `dist/` by the build) that augments `svelte/elements`. Svelte's fallback
  for an unknown tag is an index signature that accepts anything, so without this
  augmentation a misspelled attribute is dropped in silence. Measured, not
  asserted: a temporary component containing `<sk-button varaint="primary">` and
  `<sk-input naem="email">` fails `svelte-check` with
  *"does not exist in type `SkButtonAttributes`"* and *"…`SkInputAttributes`"*;
  the file was deleted and the check returned to zero errors.
- **`theme`, `preference`, `setTheme`, `THEME_INIT_SCRIPT`, `THEME_STORAGE_KEY`** —
  the §6 theme contract expressed as a Svelte store. A store is the framework's
  idiom, and the pre-paint snippet has to be *inlined in `<head>`* before the
  bundle rather than imported, so it is a string the application embeds. The
  example proves the served snippet and the package's snippet agree by running
  both and comparing the attribute they produce.

### 2. The elements are registered *after* hydration. This is the rule, not a preference.

Registering them first breaks server rendering completely, and that was measured
before it was believed. The failure mode is silent in the worst way: Svelte 5
catches its own hydration error, clears the target, and mounts the application
from scratch — the page looks right and the server's markup is gone.

The chain of evidence:

1. Registering first: `Failed to hydrate: HierarchyRequestError: Failed to
   execute 'appendChild' on 'Node': This node type does not support this method.`
   A hydration marker probe read `"kept"` before and `null` after; the app's own
   attributes the server had written were gone.
2. Localising it: the client module was stalled so the server's DOM could be
   inspected *after* the elements upgraded but *before* hydration, and the two
   node trees were serialised and diffed. The server's `#app` held 117 nodes; the
   freshly mounted tree held 274. The extra nodes are the elements' own light DOM
   — exactly the DOM a scoped element renders when no shadow root is available
   (ADR-011). An element that renders into the tree the framework is hydrating
   makes that tree stop matching the compiled template.
3. Registering second: hydration reuses the server's nodes, the marker probe
   reads `"kept"`, Svelte's hydration comments survive, and every prop still
   arrives — because the server wrote the props as attributes and an element
   reads its attributes when it upgrades.

Registering second is also what a React host has always done: React runs effects
after hydration, which is why ADR-005 puts `defineCustomElements` in an effect.
Svelte did not invent the rule; it just fails loudly when the rule is broken,
which makes the example the best proof of the rule in the repository.

The example's `hydration reuses the server's DOM instead of replacing it` test
asserts both halves — the node identity and the presence of the hydration markers
— so reordering `src/entry-client.ts` fails a test instead of quietly costing
every consumer their server rendering.

### 3. The example is `examples/svelte-vite`, and it is a separate CI job.

Server rendering needs two builds (client and SSR) and a server, which is what
`server.mjs` is: a plain `http` server that reads `dist/client/index.html` and
`dist/server/entry-server.js` and streams the rendered markup. The row in
`docs/framework-support.md` names this directory, so the matrix check fails if
either the package or the example disappears.

## Consequences

- **SvelteKit is not used, and that is a version constraint rather than a
  preference.** `@sveltejs/kit@3.1.0` declares `typescript: "^6.0.0"` and
  `vite: "^8.0.12"` as peer requirements; this repository pins `typescript`
  `5.9.3` (root `package.json`), so adopting SvelteKit means raising the
  TypeScript major for every package in the workspace. That is a larger change
  than the claim being tested needs, so the example carries a small `server.mjs`
  instead: it serves the built client assets and fills the rendered markup into
  the HTML Vite emitted. The same choice appears in `examples/nextjs` for the
  opposite reason (Next.js is already there); here it is what the pins allow.
- **SvelteKit is not proven either way.** The gate says "SSR and hydration tests"
  and the example satisfies it with a Vite SSR build, which is the same contract a
  SvelteKit adapter would have to satisfy. SvelteKit brings its own server entry
  and its own hydration path, and none of that is tested here, so the matrix row
  reads `Svelte / SvelteKit` while this ADR records that only the Svelte half is
  measured. A SvelteKit example becomes possible when the TypeScript major moves;
  it is the next piece of evidence, not a new decision.
- **Consumers must register after hydration.** The rule is now documented in
  `src/define-elements.ts` (where a consumer would look) and enforced by the
  example's test. A consumer who registers first gets a working page and no
  server rendering, which is the outcome this ADR exists to make impossible to
  ship by accident.
- **Nothing here changes the elements.** Svelte support added a package, an
  example, and one ordering rule; no component gained a Svelte-shaped branch.
  That is the outcome ADR-003 asks for — the element owns the behavior and an
  adapter that needs a workaround is a signal the element is wrong, not the
  adapter.
