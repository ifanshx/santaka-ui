---
"@santaka-ui/web-components": minor
---

docs/ARCHITECTURE.md §12 lists visual regression as test layer 7 and §16 requires an RTL
visual case per component. Neither existed; Button had an RTL test, but it is
an interaction test, and no other component had one at all.

A screenshot baseline is not a property of the code — it encodes font
rasterization, subpixel antialiasing, and the exact Chromium build — so the
suite is built around two decisions. It is its own Playwright project
(`**/*.visual.ts`), inert unless `SK_VISUAL` is set, so `pnpm run test` and
`verify` never depend on an image and a screenshot diff cannot turn the
required job red: a visual diff needs a reviewer, not a gate. And the baselines
are owned by the pinned Playwright image; `scripts/visual-baseline-docker.mjs`
is the only sanctioned way to write them, so they belong to the environment the
project declares rather than to whoever last ran `--update-snapshots`.

The spec photographs every section of the vanilla example page in light/ltr,
light/rtl, and dark/ltr — 57 baselines. §16's per-component RTL requirement
becomes a property of the spec: adding a component section to the example adds
its RTL and dark cases automatically.

Three findings from the first runs, all recorded where they happened:

- `test:visual` was POSIX (`SK_VISUAL=1 playwright test`), which fails on
  Windows before Playwright is reached. Now a small Node runner sets the
  variable and spawns the CLI identically on every platform, without adding
  `cross-env` as a dependency.
- The container build named packages by hand and omitted
  `@santaka-ui/utilities`; Stencil failed on the missing module. The build is
  now the full `pnpm run build`.
- That build was also missing `@santaka-ui/tokens` and `@santaka-ui/styles`,
  which are not in the `web-components` dependency graph, so the container
  rendered the page with no CSS. An unstyled page has no theme, so the light
  and dark shots were byte-identical, and `--update-snapshots` cannot fail on a
  baseline it is writing — 57 "passing" baselines that would never move when a
  component did. `prepare()` now asserts `color-scheme` equals the requested
  theme before any screenshot, so a suite that cannot tell an unstyled page
  from a styled one fails loudly instead of trusting the pictures.

Visual regression is not a CI gate yet, deliberately: making it blocking needs
a workflow job that runs the pinned image, which is a workflow change. The
project, the script, and the baselines are its prerequisites.
