# ADR-020: Storybook framework, and what it can and cannot host

- **Status:** Accepted
- **Date:** 2026-10-16
- **Specification:** §10 of [ARCHITECTURE.md](../ARCHITECTURE.md) (documentation and component workshop)

## Context

`docs/ARCHITECTURE.md` §10 asks for a component workshop with stories, controls, interaction
tests, an accessibility addon, and visual regression for key stories — and it
asks for one more thing that is easy to skip: **"Document Storybook framework
choice and compatibility instead of assuming one Storybook setup can directly
host every adapter without configuration."**

That sentence is the reason this ADR exists rather than a README paragraph. The
repository is not a single-framework library. It is one universal package plus
per-framework adapters, and the adapters are at different levels of maturity:
React and Vue are published, Svelte exists as of ADR-021 but has no stories
here, and Angular does not exist. A "Storybook
setup" is not one decision here; it is a decision about *which adapter the
workshop renders*, and that decision is only honest if it names what is not
being hosted.

ADR-018 had already recorded a default — "Storybook 9, React renderer first" —
as a line in its toolchain table, marked absent. This ADR is where that default
becomes an implementation, and where the parts of it that turned out to be
wrong are corrected.

## Decision

### The framework is `@storybook/react-vite`, rendering the React adapter

`apps/storybook` uses `@storybook/react-vite` and its stories import
`@santaka-ui/react` — the published package — never `packages/react/src`.

The React adapter is the right first renderer for a reason that is not
sentiment: it is the reference implementation the other adapters are written
against, and it is the one whose props are already proven against the registry
by the consumer fixture. A workshop that renders the reference implementation
is showing a consumer what a consumer gets.

The Vue adapter exists and is published, so a second renderer is *possible*
today. It is not included yet, and the reason is scope rather than doubt: a
second renderer is a second story set to keep in step, and the first one has to
exist and be reviewed before duplicating it is worth anything. When the Vue
stories are added, they follow this ADR's shape — a `storybook-vue` app or a
second workspace, rendering `@santaka-ui/vue` through
`@storybook/vue3-vite` — and the "what this does not host" list below shrinks
by exactly one line.

### Version 10, not the 9 that ADR-018 named

ADR-018 recorded "Storybook 9". The installed version is **10.6.2**, and this is
a forced deviation, not a preference:

| | peer range for `vite` |
|---|---|
| `@storybook/react-vite@9.1.21` (latest 9.x) | `^5 \|\| ^6 \|\| ^7` |
| `@storybook/react-vite@10.6.2` | `^5 \|\| ^6 \|\| ^7 \|\| ^8` |

The workspace is on **Vite 8.3.4** (`packages/react`, `packages/web-components`).
Storybook 9 does not accept Vite 8, so adopting it would mean downgrading Vite
across the workspace to satisfy the workshop — changing the library's build to
fit its documentation. Version 10 accepts Vite 8 and React 19, so it is the only
version that fits without a downgrade. ADR-018's line is corrected here; the
toolchain table there should be read as "Storybook, React renderer first" with
the version owned by this ADR.

### `addon-essentials` is not installed, and that is not an omission

Storybook 9 folded `addon-essentials` into core. Its last published version is
8.6.14, so installing it alongside Storybook 10 would pin a v8 addon against a
v10 core. Controls, actions, viewport, and backgrounds are already in core; the
two addons that are still separate and wanted are installed explicitly:
`@storybook/addon-docs` (autodocs, required for the API reference §10 asks for)
and `@storybook/addon-a11y`.

### Registration goes through the loader, and the first build proved why

The preview registers the custom elements with
`defineCustomElements(window)` from `@santaka-ui/web-components/loader` — the
explicit entry point — **not** with a bare `import "@santaka-ui/web-components"`.

This was not the first attempt. The eager-entry import was written first,
because it is what the quick-start guide shows, and it **silently failed**: the
elements rendered as inert tags, `customElements.get("sk-button")` was
`undefined`, and the built bundle contained **zero** occurrences of the string
`sk-button`. The package declares `sideEffects: ["**/*.css",
"./dist/components/index.js"]`, and Stencil's per-component registration calls
live in *chunk* files that field does not name, so the bundler was entitled to
— and did — drop them. The loader is a real function call, so nothing can elide
it.

The lesson is recorded because it is a class, not an incident: **a
side-effect-only import of this package is not a reliable way to register the
elements under a bundler that reads `sideEffects`.** `apps/docs` uses the bare
import and works, because Astro's pipeline does not tree-shake it the same way;
that is a coincidence of tooling, not a guarantee. The loader path is the one
that is correct everywhere, and it is what the workshop uses.

### What this workshop does not host

- **Vue, Svelte, and Angular adapters.** Vue is published but has no stories
  here yet; Svelte is published too as of ADR-021 and likewise has none; Angular
  does not exist. `docs/ARCHITECTURE.md` §7 is explicit that
  component and integration counts are planning targets, not a promise that
  every item ships in v1.0, so an absent renderer is recorded as absent rather
  than implied by a "universal" workshop that renders one framework.
- **A universal-element story set.** The universal package is exercised by the
  vanilla example page and by the ADR-019 visual baselines. Rendering
  `<sk-button>` inside a React workshop would prove nothing the React adapter
  does not already prove, and would blur which layer a defect lives in.

### Theme is a global, not a story arg

The dark theme is selected by `[data-sk-theme="dark"]` at `:root` (ADR-013), so
it cannot be a per-story prop. A decorator sets the attribute on the preview
document for the lifetime of the story and restores the previous value on
unmount; the toolbar drives it. The built-in backgrounds addon is disabled
rather than configured, because it would be a second, conflicting way to say
the same thing — two controls for one decision is a way to make a screenshot
that disagrees with the toolbar.

## Consequences

- The workshop renders the React adapter. A Vue story set is a separate,
  additive decision, not a modification of this one.
- Storybook is pinned to the major that accepts the workspace's Vite. A Vite
  major bump is now coupled to a Storybook major bump, and the peer range in
  the table above is the check to run before either.
- Storybook 10 is a **new dependency tree** — the security and license audits
  now scan it. It is a private, unpublished app, so an advisory in it is
  classified by reach as dev-only; the classification is what ADR-018's
  security work is for, and this is its first real test.
- The story set is a second place a component's public API is written down. It
  is not a third source of truth: it imports the package, so a prop rename
  breaks the story at typecheck rather than drifting quietly. That is the
  property that makes the workshop worth keeping in step.

## What would reverse this

- **A Vue (or Svelte, or Angular) story set** would not reverse the React
  choice — it would sit beside it. The reversal would be a single *multi-framework*
  Storybook if Storybook's builder could host the adapters without per-framework
  config; today it cannot, which is exactly what §10 warns against assuming.
- **Storybook accepting a Vite version we drop below** would remove the forced
  10.x pin and let the version track ADR-018's original note.
- **Stencil changing its `sideEffects` output** — naming the registration
  chunks — would make the bare import reliable again, and the loader requirement
  would become a preference rather than a correction.
