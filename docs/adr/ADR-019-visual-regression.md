# ADR-019: Visual regression baselines and the environment that owns them

- **Status:** Accepted
- **Date:** 2026-10-14
- **Plan deadline:** end of weeks 11–12 (`plan.md` §18, §17 RTL requirement)

## Context

`plan.md` §12 lists visual regression as test layer 7, and §17 makes two
requirements concrete: **every component has an RTL visual regression case**,
and a component with no RTL story is not Stable. Neither exists. Button is the
only component with an RTL test at all, and it is an interaction test.

The obstacle is not writing the tests; it is that a screenshot baseline is not
a property of the code. It encodes font rasterization, subpixel antialiasing,
the exact Chromium build, and the OS's text stack. Two machines produce two
different pictures of identical markup, so a baseline generated on one is a
permanent diff on the other — and a suite that fails on every developer's
machine is a suite that gets `--update-snapshots`'d without review, which is
worse than no suite.

## Decision

**Visual regression is a separate Playwright project (`visual`) with a
separate script (`test:visual`), and the committed baselines are owned by a
pinned Docker image.**

### The project is separate

- `testMatch: "**/*.visual.ts"`, disjoint from `**/*.e2e.ts`, so the two
  projects never claim the same file.
- The project is **inert unless `SK_VISUAL` is set**. `pnpm run test` and
  `pnpm run verify` therefore never depend on a baseline image: a screenshot
  diff cannot turn the required CI job red. This is deliberate. A visual diff
  is a *review artifact* — it needs a human to say "that is the change I
  meant" — and a gate that demands human judgement on every commit trains
  people to bypass it.
- `test:visual` sets the flag and runs only that project.

### The baseline environment is the pinned image

- Baselines are generated and verified inside
  `mcr.microsoft.com/playwright:v1.64.0-noble` — the same version as the
  `@playwright/test` dependency. `packages/web-components/scripts/visual-baseline-docker.mjs`
  is the only sanctioned way to write a baseline: `--update` to rewrite, no
  argument to verify. A baseline committed from a laptop is a diff waiting to
  happen. It is Node rather than a shell script because `bash` on a Windows
  checkout is often the WSL relay with no distribution installed; the shell
  logic it spawns lives in `visual-baseline-entrypoint.sh`, which runs inside
  the container where bash is guaranteed.
- **Bumping `@playwright/test` without bumping the image tag is the failure
  mode to watch for.** A Chromium update changes text rendering, and the
  baselines must be regenerated in the new image in the same commit as the
  dependency bump. The script prints the image tag it used so a reviewer can
  see the two agree.
- The config pins `viewport: 1000×900`, `deviceScaleFactor: 1`,
  `animations: "disabled"`, `caret: "hide"`, and `maxDiffPixelRatio: 0.01`.
  Each is a determinism prerequisite, not a tolerance to loosen: a running
  animation or a blinking caret makes the shot nondeterministic, and a 1%
  pixel budget absorbs antialiasing without absorbing a real change.

### What is photographed

Every section of the vanilla example page — which mounts every component in
its documented states — in three passes: **light/ltr, light/rtl, dark/ltr**.
That is 35 sections × 3 = 105 baselines, and it satisfies §17's per-component
RTL requirement in the cheapest honest way: the same component photographed in
both directions, rather than a hand-written RTL assertion per file that could
silently stop covering a component.

The count is enforced rather than counted by hand. `SECTIONS` in the spec was
maintained manually and drifted: `combobox` and `popover` rendered in the example
page and were photographed by no test, so two of the six newest components had
zero visual-regression coverage with nothing saying so. A guard test now reads
every `section[aria-labelledby]` off the page and fails when the two lists
disagree in either direction.

The example page is photographed rather than purpose-built fixtures because it
is the artifact a human actually reviews: a diff here is a picture someone can
look at and judge, not a rectangle of isolated markup.

### The failure this suite already had, and the guard against it

The first run inside the container produced a full set of baselines, all
"passing", and all worthless. The container build was filtered to the
`web-components` package and its dependencies, which does not include
`@santaka-ui/tokens` or `@santaka-ui/styles` — `styles` depends on `tokens`,
but nothing the `web-components` graph touches depends on either. So the page
rendered with no
token CSS and no component CSS. An unstyled page has no theme, so the light and
dark shots were byte-identical, and an unstyled page has no layout, so the
"diff" was a rectangle of default text that would never change when a component
did. `--update-snapshots` cannot fail on a baseline it is writing, so nothing
reported a problem.

Two fixes, because the root cause and the detection are separate problems:

- The container runs the full `pnpm run build`, not a filtered one. Every
  artifact the example page loads is a build output, so "build everything" is
  the correct instruction; the filter was an optimization that removed a
  dependency it could not see.
- `prepare()` asserts `color-scheme` equals the requested theme before any
  screenshot. It is declared by the generated token stylesheet, so it is the
  canary for "the CSS loaded at all". If the token package is ever dropped from
  the build again, the suite fails loudly instead of recording identical light
  and dark images. The guard is the part that matters: the build fix addresses
  today's cause, the assertion addresses the class.

## Consequences

- **Visual regression is not a CI gate yet.** It runs on demand and in review.
  Making it blocking requires a CI job that runs the pinned image, which is a
  workflow change, not a test change; the project and script are the
  prerequisites for that job, and they exist now.
- RTL coverage stops being a per-component promise and becomes a property of
  the spec: adding a component section to the example automatically adds its
  RTL and dark baselines.
- The dark baselines are the ones that earn their keep. The contrast work in
  ADR-008 was a dark-theme defect class that no style assertion caught; a dark
  baseline is the net under the next one.
- A component change that alters rendering now produces a diff in three
  baselines, and the PR is expected to include the regenerated images. That is
  the review cost of the suite, and it is the point.

- **The committed baselines are stale as of 2026-10-20, and say so.** Nine
  component sections were added to the example page — slider, breadcrumb,
  pagination, drawer, taka, banner, field, avatar, and kbd — and the existing
  sections now sit below new markup. Two consequences follow, and both are
  recorded rather than smoothed over:

  1. The nine new sections have **no baselines at all**. They were added to
     `SECTIONS` in the same change, so the spec expects files that do not exist
     yet.
  2. The 72 existing baselines were photographed against the **previous**
     example page. Any of them whose section moved, or which captured a scroll
     position rather than an element, is now wrong.

  Regenerating requires the pinned image
  (`mcr.microsoft.com/playwright:v1.64.0-noble`) via
  `node scripts/visual-baseline-docker.mjs --update`. On the machine where this
  was recorded the Docker CLI is installed but **no daemon is running and Docker
  Desktop is not installed**, so the update could not be performed here. Regenerating
  on an ordinary workstation instead would produce exactly the failure ADR-019
  exists to prevent — baselines owned by whichever machine ran last — so the honest
  state is "stale and awaiting the pinned run", not "regenerated locally".

  **Do not treat a green `visual` run as evidence until the update has happened
  in the pinned image.**

## What would reverse this

If Playwright ships a rendering backend stable across platforms — or if the
project adopts a hosted visual-diff service with per-PR review built in — the
Docker pin becomes unnecessary and the project could run in the normal CI
matrix. The separate-project decision would still stand: the reason it is
separate is the human-review requirement, not the environment pin.
