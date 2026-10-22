# Svelte + Vite example

A server-rendered Svelte 5 app consuming `@santaka-ui/svelte` and
`@santaka-ui/web-components` through a real bundler.

## What this exists to prove

`docs/ARCHITECTURE.md` §3 gives the Svelte row one gate: **"Props/events, SSR and hydration
tests."** The framework support matrix recorded the row as `Planned` with the note
that a *claimed* integration needs a package, an example, and the SSR/hydration
proof. This directory is the third of those; §16's *"every form control submits
through a plain `<form>`"* is the second claim it carries, because a framework
path that renders but cannot submit is not an integration.

Two things here cannot be proven in jsdom, which is why they are browser tests:

- **The server render is real markup.** The page is rendered per request by
  `server.mjs`, so the custom element tags reach the browser as HTML the parser
  reads before any JavaScript runs — not as a string a test compared.
- **Hydration adopts that markup instead of replacing it.** Svelte 5 hydrates by
  walking the server's nodes against the template its compiler emitted, and when
  a node does not match it *silently* clears the target and mounts from scratch.
  The page still looks right; the server rendering is simply gone. One test
  asserts that hydration reused the nodes, and it is the test that made the
  example's registration order a rule rather than a preference (ADR-021).

## Run it

```sh
pnpm --filter @santaka-ui/example-svelte-vite dev     # dev server, port 4176
pnpm --filter @santaka-ui/example-svelte-vite build   # client + SSR builds
pnpm --filter @santaka-ui/example-svelte-vite start   # serve the built output
pnpm --filter @santaka-ui/example-svelte-vite test    # build, then Playwright
```

`build` runs Vite twice: `dist/client` for the browser bundle and `dist/server`
for `entry-server.ts`. `start` runs `server.mjs`, which serves the built assets
and fills `renderAppHtml()` into the `<!--app-html-->` placeholder of the HTML
Vite emitted — asset hashing stays Vite's job. The tests run against that built
output, never the dev server, because a dev server compiles Svelte differently and
would test a hydration nobody ships.

## What the app demonstrates

- **All six form-associated controls in one plain `<form>`** — `Input`,
  `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup` — with submission read
  back through the browser's own `FormData` and printed to an `<output>`, so what
  the browser sent is visible on the page rather than only in Svelte state.
- **Native constraint validation.** The `email` field is `required`, so the
  browser blocks the submit event and the app's handler never runs; a second test
  covers the values a control *withholds* rather than submits empty.
- **Reset restores what the server rendered**, which is a claim about the initial
  values surviving hydration rather than about `reset` itself.
- **The element's own event.** `sk-value-change` reaches the app through a
  `onsk-value-change` binding, and the detail is rendered so the test can read
  what the element reported.
- **The §6 theme contract.** `theme`, `preference`, and `setTheme` from
  `@santaka-ui/svelte`, driven by a button that works with a pointer *and* with
  the keyboard, and confirmed against the served pre-paint snippet.
- **Types where Svelte has none.** `src/app.d.ts` references
  `@santaka-ui/svelte/elements`, so a misspelled attribute is a `svelte-check`
  error instead of a silently dropped one.

## Registration: after hydration, and why

`src/entry-client.ts` calls `hydrate()` first and `defineSantakaElements()` after
it. Reversing those two lines costs every consumer their server rendering, and the
example measures it:

- The elements are `scoped: true, shadow: false` (ADR-011), so an element renders
  **into its own light DOM**. Upgrading one therefore mutates the tree Svelte is
  hydrating. Serialising both trees showed the server's `#app` holding 117 nodes
  and the post-mount tree holding 274 — the difference being the elements' own
  rendered DOM.
- Registering first produces `Failed to hydrate: HierarchyRequestError`, then
  Svelte clears the target and mounts again. Registering second keeps the server's
  markup, its props (which the server wrote as attributes for the element to read
  when it upgrades), and its hydration markers.

This is not a Svelte-only rule. React has always run effects after hydration, which
is why `examples/nextjs` defines the elements in an effect (ADR-005). Svelte fails
loudly where React merely would have replaced the markup quietly, so this example
is the repository's clearest proof of the ordering.

## What this example does not do

- **No SvelteKit.** `@sveltejs/kit@3.1.0` peer-requires `typescript ^6.0.0` while
  the workspace pins `5.9.3`, so SvelteKit would mean a TypeScript major across
  every package. `server.mjs` is small enough to be honest about what it proves,
  and SvelteKit's own server entry stays untested (ADR-021).
- **No cross-browser run.** Playwright runs Chromium only. Browser support is the
  universal package's claim, tested on three engines in its own suite (ADR-014).
- **No visual regression.** The appearance test asserts that the chrome's classes
  reach the rendered controls; pixel baselines live in the pinned Docker run
  (ADR-019), not here.
