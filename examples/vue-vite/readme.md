# Vue + Vite example

A single-page Vue 3 app consuming `@santaka-ui/vue` through a real bundler.

## What this exists to prove

plan.md section 17 has a release gate: *"Every form control submits through a
plain `<form>` in React, Vue, and the universal package."*

The universal half is proven in `packages/web-components/e2e/` — all six
form-associated controls, in Chromium, reading the browser's own `FormData`. The
React half is proven in `examples/react-vite`. The Vue half was **not** proven,
and the reason is the same one that applied to React: the Vue adapter's unit
tests run under jsdom, which has no form submission and no form-associated custom
element implementation. They could assert that `name` reached the element's
attribute or property. They could not assert that the browser submitted the
control.

This example closes that gap. It does not carry a defect story of its own the way
the React example does — the `name` bug was found and fixed in the React adapter,
and the Vue adapters were written afterwards with that failure in mind. What it
proves is that the fix holds on the Vue side, where the mechanism differs:

> Vue chooses between writing a **property** and an **attribute** with
> `key in element`. For `name`, that choice is not the same for every component:
> `Checkbox`, `Switch`, and `Select` declare **no `name` prop at all** — a
> form-associated custom element is named by its host *attribute*, which is what
> the platform reads — so the check is false and Vue writes the attribute;
> `RadioGroup` **does** declare it (`@Prop({ reflect: true }) name = ""`), so Vue
> writes the property, and the element reflects it back to the attribute. Both
> routes have to end in a submitted entry, and only a real browser can show that
> they do.

## Run it

```sh
pnpm --filter @santaka-ui/example-vue-vite dev        # dev server, port 4175
pnpm --filter @santaka-ui/example-vue-vite build      # production build
pnpm --filter @santaka-ui/example-vue-vite test       # Playwright, against the build
```

The tests run against the **built** output, not the dev server, because the point
is to exercise the same module resolution a consumer's production build uses.

## What the app demonstrates

- All six form-associated controls inside one plain `<form>`: `Input`,
  `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`.
- Submission read through the browser's `FormData`, printed to an `<output>` so
  what the browser sent is visible on the page rather than only in Vue state.
- Native constraint validation: the `email` field is `required`, so the browser
  blocks the submit event and the app's handler never runs.
- `Button`, `Card`, `Badge`, and `Link` for the surrounding chrome.

## Registration: eager, and why

`src/define-elements.ts` calls `defineCustomElements` at module scope. That is
the opposite of the Next.js example, which defers into a `useEffect`, and both
are correct for their own reason:

- **Next.js** renders HTML on the server before any JavaScript runs, so the
  markup must be inert HTML first and upgrade later (ADR-005).
- **Vite** ships an empty `<div id="app">`. There is no server-rendered markup
  to protect, so deferring would only delay the upgrade and show a flash of
  unstyled elements with nothing gained.

## What this example does not do

- **No SSR.** It is a client-rendered SPA. The Vue adapter's server-render path
  is proven separately, in `tests/consumer/run.mjs`, which renders it through
  `vue/server-renderer` from the packed tarball.
- **No cross-browser run.** Playwright runs Chromium only here. Browser support
  is the universal package's claim, tested on all three engines in its own suite
  (ADR-014) — running this on three would triple the cost to re-prove something
  it does not test.
