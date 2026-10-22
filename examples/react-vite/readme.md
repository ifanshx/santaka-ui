# React + Vite example

A single-page React app consuming `@santaka-ui/react` through a real bundler.

## What this exists to prove

docs/ARCHITECTURE.md section 16 has a release gate: *"Every form control submits through a
plain `<form>` in React, Vue, and the universal package."*

The universal half is proven in `packages/web-components/e2e/` — all six
form-associated controls, in Chromium, reading the browser's own `FormData`. The
React half was **not** proven, and the reason is worth stating plainly: the React
adapter's unit tests run under jsdom, which has no form submission and no
form-associated custom element implementation. They could assert that `name`
reached the element's attributes. They could not assert that the browser
submitted the control.

This example closes that gap, and doing so found a real defect:

> `Checkbox`, `Switch`, and `Select` dropped `name`. A form-associated custom
> element with no `name` is unnamed, and an unnamed control contributes nothing
> to `FormData`. So those three rendered, validated, took focus, and reported
> their values through `onValueChange` — and then silently contributed nothing to
> the form they were in. Nothing in the adapter's own tests looked at `name`.

The fix is in `packages/react/src/{checkbox,switch,select}.tsx`, with a
millisecond-scale regression test in `packages/react/src/form-name.test.tsx` and
the browser proof in `e2e/form-submission.e2e.ts`.

## Run it

```sh
pnpm --filter @santaka-ui/example-react-vite dev        # dev server, port 4174
pnpm --filter @santaka-ui/example-react-vite build      # production build
pnpm --filter @santaka-ui/example-react-vite test       # Playwright, against the build
```

The tests run against the **built** output, not the dev server, because the point
is to exercise the same module resolution a consumer's production build uses.

## What the app demonstrates

- All six form-associated controls inside one plain `<form>`: `Input`,
  `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`.
- Submission read through the browser's `FormData`, printed to an `<output>` so
  what the browser sent is visible on the page rather than only in React state.
- Native constraint validation: the `email` field is `required`, so the browser
  blocks the submit event and the app's handler never runs.
- `Button`, `Card`, `Badge`, and `Link` for the surrounding chrome.

## Registration: eager, and why

`src/define-elements.ts` calls `defineCustomElements` at module scope. That is
the opposite of the Next.js example, which defers into a `useEffect`, and both
are correct for their own reason:

- **Next.js** renders HTML on the server before any JavaScript runs, so the
  markup must be inert HTML first and upgrade later (ADR-005).
- **Vite** ships an empty `<div id="root">`. There is no server-rendered markup
  to protect, so deferring would only delay the upgrade and show a flash of
  unstyled elements with nothing gained.

## What this example does not do

- **No SSR.** It is a client-rendered SPA. The SSR claim is Next.js's, and it is
  proven there (ADR-005).
- **No cross-browser run.** Playwright runs Chromium only here. Browser support
  is the universal package's claim, tested on all three engines in its own suite
  (ADR-014) — running this on three would triple the cost to re-prove something
  it does not test.
