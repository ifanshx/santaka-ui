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
  run. First cross-engine evidence: 261 tests pass on Chromium, 260 + 1 flaky on
  Firefox, 261 on WebKit.
- **Visual regression.** A dedicated `visual` project photographs every
  example-page section in light/ltr, light/rtl, and dark/ltr — 57 baselines.
  Deliberately not a CI gate, because a screenshot diff needs a reviewer
  (ADR-019).
- **Consumer fixture.** Packs all eight packages, installs the tarballs into a
  scratch project outside the workspace, and runs 11 checks (§17).
- **Touch-target coverage** for all ten interactive components, with the threshold
  read from `--sk-touch-min` rather than asserted as 44 (§17).
- **Dependency license and security audits** (§17).
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
