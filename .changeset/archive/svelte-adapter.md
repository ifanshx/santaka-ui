---
"@santaka-ui/svelte": minor
---

`@santaka-ui/svelte` — the third framework adapter, and the first that ships no
components. Svelte 5 decides per write whether a prop goes to the element's
property or its attribute — the setters it exposes when it is registered, an
object-valued prop as a property while it is not (read in the pinned Svelte
source, and measured in the example's tests) — so a wrapper would restate what the
compiler does and give every prop a second name. The package
ships the two things Svelte cannot supply: a types-only `./elements` subpath and
the section 6 theme store (`theme`, `preference`, `setTheme`, `THEME_INIT_SCRIPT`,
`THEME_STORAGE_KEY`). 9 unit tests cover the store, including the pre-paint
snippet executed as a program rather than matched as text.

The types earn their place. Svelte's fallback for an unknown tag accepts
anything, so a misspelled attribute is dropped in silence. Measured: a temporary
component with `<sk-button varaint="primary">` and `<sk-input naem="email">` fails
`svelte-check` naming `SkButtonAttributes` and `SkInputAttributes`.

`examples/svelte-vite` is the fourth example and the second server-rendered one —
`server.mjs` serves the Vite-built client assets and fills the rendered markup
into the emitted HTML per request. 12 browser tests cover the served markup,
props, the element's own `sk-value-change` event, all six form controls through
the browser's `FormData`, native constraint validation, withheld values, reset,
and the theme contract by pointer and by keyboard.

**The finding worth the release note: register the elements after hydration.**
Registering them first produced `Failed to hydrate: HierarchyRequestError`, after
which Svelte 5 clears the target and mounts the application again — the page looks
correct and the server's rendering is gone. Localising it meant stalling the
client module, inspecting the DOM after the elements upgraded but before
hydration, and serialising both node trees: 117 nodes server-side, 274 after the
fresh mount, the difference being the light DOM these scoped elements render
(ADR-011). Registering after hydration keeps the nodes, the hydration markers and
the props, and it is the order React has always used (ADR-005). The example
asserts both halves, so reordering `src/entry-client.ts` fails a test instead of
quietly costing consumers their server rendering (ADR-021).

The framework support matrix row moves from `Planned` to `Stable`; the check had
in fact been failing since the package landed, which is the drift it exists to
catch. A `svelte-example` CI job runs the example's suite. SvelteKit is **not**
covered: `@sveltejs/kit@3.1.0` peer-requires `typescript ^6.0.0` against the
workspace's `5.9.3`, so the row's `Svelte` half is measured and its `SvelteKit`
half is recorded as unmeasured.
