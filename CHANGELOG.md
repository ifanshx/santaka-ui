# Changelog

All notable changes to the published packages are documented in this file.

**No release has been published to npm.** Every package is `0.1.0`. This file
records what has landed in the repository since the initial foundation, so the
first release has a history to publish rather than an empty file.

Format follows [Keep a Changelog](https://keepachangelog.com/), and versions
follow [RELEASE.md](./docs/RELEASE.md) — which is §14 made concrete. Breaking
changes get a pointer to [MIGRATIONS.md](./docs/MIGRATIONS.md).

## [Unreleased]

### Added — packages

- `@santaka-ui/mcp` — stdio MCP server over the registry metadata. Four tools
  (`search_components`, `get_component`, `get_tokens`, `get_usage`). No model, no
  network at query time. 19 unit tests plus a smoke test that drives a real MCP
  client over an in-memory transport (§11, ADR-015).
- `@santaka-ui/cli` — the `santaka` command: `init`, `add`, `list`, `doctor`,
  `diff`, `theme init`, `registry`, `update`. 37 unit tests and 18 end-to-end tests
  against the built binary. Source mode copies component files into the consumer's
  repository with a manifest and a conflict rule (§8, ADR-009).
- `@santaka-ui/docs` — the documentation site. Astro, pages generated from the
  registry, Pagefind for search. 24 pages (§10, ADR-006).

### Added — components

- **`sk-alert`** — a status surface. `role="status"` for informational variants and
  `role="alert"` for the interrupting one, which is the whole reason the component
  exists: an author picking a variant is choosing an announcement policy.
- **`sk-empty-state`** — the placeholder surface: heading, description, an icon
  slot, and an actions slot. `bare` drops the chrome for the state sitting inside a
  card, the same reasoning as `sk-card.bare`.
- **`sk-progress`** — determinate and indeterminate are one component: omitting
  `value` is the indeterminate signal, and `aria-valuenow` is omitted with it
  rather than sent as `0`. A second prop would be a second way to say
  `value === undefined`, and the two could disagree.
- **`sk-accordion` / `sk-accordion-item`** — a disclosure group over native
  `<details>`/`<summary>`: the platform owns the semantics, the focus stop, and
  Enter/Space activation. `multiple` on the group controls sibling exclusion;
  `open` on the item reflects both ways, so a consumer can author it in HTML and
  read back what the browser did. The `toggle` listener is bound to the inner
  `<details>` — `toggle` does not bubble, and a host-level listener leaves the
  reflected `open` attached to nothing while every click still toggles the native
  node.
- **`sk-table`** — a skin a consumer authors a real `<table>` inside, so the table
  semantics, the caption, and the column headers survive untouched. The scroll
  region is the keyboard stop and carries the accessible name; `plain` is for a
  table inside a card, `striped` and `density` for reading a lot of rows.
- **The six ship complete:** React and Vue adapters, Storybook stories (with
  interaction tests on the accordion, progress, empty-state, and table), registry
  entries with derived props and events, and browser tests.

### Added — capabilities

- **Form controls.** Checkbox, Switch, Radio Group — completing the v1.0 Tier 2
  form scope. All three are form-associated custom elements: they submit through a
  plain `<form>` with no JavaScript state, and the browser owns validation.
- **`formStateRestoreCallback` coverage.** The third FACE callback, implemented on
  all six controls and previously untested. 9 tests. Driving it honestly required a
  measurement: the back/forward cache does **not** fire the callback in Chromium,
  so a test built on `page.goBack()` would pass with the callback deleted.
- **Registry payload published as static versioned JSON** under
  `apps/docs/public/registry/` — current, immutable per version, and one file per
  component. `santaka registry add <url>` reads the same shape (ADR-007).
- **`llms.txt` and `llms-full.txt`**, generated from the registry and verified in
  CI (§11).
- **Browser support matrix**, generated from the Playwright projects that actually
  run. First cross-engine evidence: 328 tests pass on Chromium, 328 on Firefox, and
  328 on WebKit — and that same run is what found the two accordion flakes the
  Fixed section records, which is the reason to run it rather than claim it.
- **Visual regression.** A dedicated `visual` project photographs every
  example-page section in light/ltr, light/rtl, and dark/ltr — 72 baselines.
  Deliberately not a CI gate, because a screenshot diff needs a reviewer
  (ADR-019).
- **Consumer fixture.** Packs all eight packages, installs the tarballs into a
  scratch project outside the workspace, and runs 11 checks (§16).
- **Touch-target coverage** for all eleven interactive components — 15 tests, with
  the threshold read from `--sk-touch-min` rather than asserted as 44 (§16).
- **Dependency license and security audits** (§16).
- **Registry `props` and `events`**, derived from the committed declarations and
  component sources rather than authored — which is what lets `get_component` and
  the docs page report them.
- **Registry index** (`@santaka-ui/core/registry`) — every entry in one document,
  so the CLI and MCP server need not walk a directory.

### Fixed

- **`loader/cdn.js` no longer ships.** It was a CommonJS shim requiring
  `dist/cjs/loader.cjs.js`, a file the build deletes: unreachable *and* broken, and
  in every tarball because nothing looked inside `loader/`. Found by the consumer
  fixture.
- **`turbo` task concurrency bounded to 50% of CPUs**, and **`packages/react`'s
  vitest worker pool bounded to 2 forks**. The default of ten concurrent tasks
  multiplied by per-core worker pools oversubscribed the machine; the symptom was
  `Failed to start forks worker` in whichever package lost the race, which read as
  `verify` failing on a package nobody had touched.
- **Line endings normalised** (`* text=auto eol=lf`). Prettier is configured with
  `endOfLine: "lf"`, so a Windows checkout that converted endings made
  `prettier --check .` fail on files nobody had edited.
- **The tooltip hover assertion** no longer bounds a 300ms component delay with a
  1000ms timeout, which measured the scheduler under parallel load rather than the
  component. The negative assertion at 120ms is what proves the delay is real.
- **`sk-open-change` no longer reports a toggle that changed nothing.** WebKit
  fires an extra `toggle` for the sibling a single-open group is about to close,
  and it reads that node before the close has reached it — so the item reported
  `open: true` for an item that was closed and stayed closed, and one click
  produced three events there and two in Chromium. The item now compares against
  the value it last reported rather than against its `open` property, which is
  already `false` by the time the platform's toggle for the group's close arrives:
  that comparison swallowed the close instead of the lie. Found by the first
  cross-engine run.
- **Two flaky browser tests fixed at their cause, not with a retry.** The
  accordion's marker assertion sampled a computed style once, immediately after
  the property changed, while the rule it reads keys off the reflected
  `data-open` attribute written a render later. Its event assertion pinned the
  *order* of the two `sk-open-change` events, which is not contracted — WebKit
  nests the sibling's close inside the open's own dispatch, Chromium queues it —
  so the assertion was asserting one engine's timing as the contract. The reads
  retry now, the events are found by heading, and the count pins the contract.
- **The axe scans now wait for the fixture instead of a fixed delay.** The
  `beforeEach` resolved on the *first* `.hydrated` and then slept 500 ms, which is
  not the same as every custom element being upgraded — ADR-008 requires that, and
  on a loaded machine the rest upgrade later, so the scan read a half-upgraded
  page and reported wiring the upgraded element does not have. Measured: the two
  whole-page scans failed once under `verify`'s parallel task load (the only
  failure in that run) and pass in isolation, 36 repeats under four workers. The
  wait now requires every *registered* custom element to be hydrated — `slot-fb`,
  Stencil's slot fallback, is hyphenated and never hydrates, so an unfiltered
  version of this wait hangs — and for finite animations to have landed, since axe
  reads computed styles. A failure message now carries the scan-time state, so the
  next occurrence names its own cause instead of becoming another mystery.
- **`web-components` now publishes `src/components`**, so the CLI's source mode
  works for a consumer and not only inside this repository.

### Changed

- **Internal dependency bumps are `minor`, not `patch`.** When the components
  package gains a component, the React adapter has gained it too — a feature, not a
  fix. Publishing only a patch would tell adopters nothing changed.

### Known limitations

- `sk-tab` is 39px and `sk-link` is 24px. Both clear WCAG 2.2 SC 2.5.8 (24px);
  neither reaches the project's own `--sk-touch-min` of 44px. `sk-link` is exempt
  outright, because SC 2.5.8 exempts an inline target in a sentence. Recorded and
  pinned by a test, not rounded away.
- `pnpm audit` reports 40 advisories, none reaching a published package's direct
  dependencies — all are in `next` and `sharp` (the Next.js example) and `postcss`
  (the build chain).
- Visual regression is not a CI gate.
- The legal preconditions in §13 are unresolved, so nothing can be published.
