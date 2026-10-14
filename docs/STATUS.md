# Implementation status

Verified against `plan.md` on 2026-10-12. This is a status readout, not a plan:
`plan.md` is the plan, `docs/adr/` records the decisions, and this file records
what exists today. Every claim below is checked against the repository.

## Summary

Weeks 1–4 of the roadmap. The token layer and the universal Web Components
package are real, tested, and green; the React package now covers all
twenty-one shipped components; the CLI, registry hosting, documentation site,
and Storybook do not exist yet.

`pnpm run verify` exits 0 from a cold cache. **626 tests pass** (48 token, 20
utilities, 138 core, 159 React, 261 Playwright and barrel across the universal
package, plus the MCP server and the CLI). All eight packages pass `publint` and
`attw --pack`.

## Done

### Token layer

- DTCG source of truth compiled to CSS custom properties, light and dark.
- The build fails on an unknown token reference or a contrast pair below its
  target, and writes a contrast report. 27 pairs gated, all passing.
- Every color emitted twice — hex then `oklch()` behind `@supports` — so a
  Core-tier browser renders the intended color.
- **48 tests**: 28 pipeline math, 20 theme-contract relationships. The contract
  tests cover what a build cannot: a token is only wrong relative to the theme it
  renders in.

### Components

Twenty-one universal custom elements — Tier 1 complete; **Tier 2 v1.0 scope
complete**: Dialog, Alert Dialog, Toast, Tooltip, Select, Tabs, Checkbox,
Switch, Radio Group, each with browser tests against real Chromium:

| Component | Notable coverage |
|---|---|
| `sk-button` | form participation, keyboard, 44px target, RTL, theme, brutalist geometry measured in-browser |
| `sk-icon-button` | accessible name, square hit target on **both** browser tiers, spinner |
| `sk-link` | anchor semantics, external indicator, theme |
| `sk-badge` | variant fills from tokens (not `color-mix`), dot label for WCAG 1.4.1 |
| `sk-input` | FACE submission, all three form callbacks, native validation, label and error wiring |
| `sk-textarea` | the same contract as Input over a shared base, plus `rows` sizing and vertical resize |
| `sk-card` | a surface, not a control: no role, no focus, no click handler |
| `sk-text` | applies one whole type step; the consumer element keeps its semantics |
| `sk-spinner` | announces by label, ring aria-hidden; spin stops under reduced motion |
| `sk-skeleton` | aria-hidden scaffolding; shimmer removed entirely under reduced motion |
| `sk-label` | programmatic `for` wiring; click-to-focus via the browser, not a handler |
| `sk-separator` | a real <hr>: announces itself, or steps out when decorative |
| `sk-dialog` | native <dialog>: focus trap, Escape, backdrop, focus return — all the browser's |
| `sk-alert-dialog` | role=alertdialog, Escape refused, focus on the chosen default action |
| `sk-toast` | role=status, clock pauses on hover, duration=0 never expires, never steals focus |
| `sk-tooltip` | aria-describedby wiring, hover delay vs instant focus, panel takes no pointer events |
| `sk-select` | a real native <select>, visibly: FACE, native validation, plain-form submission |
| `sk-checkbox` | FACE on a boolean, indeterminate submits as unchecked, native validation |
| `sk-switch` | the checkbox contract under role=switch: FACE, native validation, thumb slide |
| `sk-radio-group` | real native radios in a radiogroup: browser-owned arrows, group-level FACE |

**257 Playwright tests** plus the barrel-export contract tests. Chrome carries
the brutalist treatment — 3px stroke,
`border-radius: 0`, zero-blur offset shadow — with the press measured in a
browser: hover lifts to `-2px -2px` with a `7px 7px` shadow, press moves to
`3px 3px` with `2px 2px`.

### Two materials, and the budgets that measure them

`materials.e2e.ts` asserts the system's two-material rule directly: chrome is
hard-edged and glass rounds, and a test that only checked chrome would pass on a
build where glass had quietly become a third hard-edged surface. It also covers
the press, the focus ring, reduced motion, and the `ghost` variant's deliberate
flatness at rest.

The runtime budget **was measuring 5 of the 7 components**. Its fixture listed
the exported classes by hand, so Input, Textarea, and Card shipped without ever
being imported — and tree-shaking dropped them, leaving the reported figure
exactly where it was. A budget that stops measuring when a component is added
is worse than no budget, because the number still looks authoritative. It now
derives the list from the barrel and throws if it finds none: **11.46 KB**, not
the 9.34 KB that was being reported.

### React package

`Button`, `IconButton`, `Link`, `Badge`, `Card`, `Input`, `Textarea`, `Text`, `Spinner`, `Skeleton`, `Label`, `Separator`, `Dialog` + `DialogTrigger` + `DialogContent`, `AlertDialog` + `AlertDialogContent`, `Toast`, `Tooltip` + `TooltipTrigger`, `Select`, `Tabs` + `TabsList` + `Tab` + `TabPanel`, `Checkbox`, `Switch`, `RadioGroup`, plus `ThemeScript` /
`useTheme`. **159 tests.** Two requirements are enforced in the type system
rather than left to review: `<Badge dot />` does not compile without
`statusLabel`, and `Input` generates its id with `useId()` so the id stays
stable across re-renders.

### Core and utilities

- Registry JSON Schema, validation of untrusted entries, checksums verified
  against shipped files.
- `validate`, `cn`, `id` — 20 tests.
- **5 exports-contract tests** asserting every stylesheet a package builds is
  reachable through `exports`, and every export resolves to a file that exists.

### Form controls share one base

`sk-input` and `sk-textarea` are the same contract over a different element, so
their form behavior lives in `shared/form-control-base.ts` rather than twice.
The extraction is not cosmetic: the base reads and writes the component through
**accessors**, because an earlier snapshot-shaped state object looked simpler and
silently broke value propagation — the base wrote to a copy the component never
saw, and the field stopped submitting.

### Scoped mode removes the `<slot>` element

ADR-011 puts these components in **scoped**, not shadow, encapsulation. Scoped
mode strips the `<slot>` element from the light DOM and relocates the assigned
nodes into its place. A selector of `slot[name="footer"]` therefore matches
nothing, and its rules **silently never apply** — no error, no warning, just a
style that was never drawn. The first version of `sk-card.css` styled its
footer separator that way.

Everything that must be styled has to hang off a real wrapper element.
`e2e/card.e2e.ts` asserts no `sk-card slot` exists in the light DOM, so the next
author to reach for a slot selector finds out immediately.

Related: an optional slot still needs a guard. Rendering the footer wrapper
unconditionally draws a rule across an empty band on every headerless card.
`:empty` handles it — CSS ignores the comment nodes scoped mode leaves behind —
and the test verifies that rather than assuming it.

### Distribution

- **ESM only.** 358 KB of unreachable CommonJS removed; Stencil has no option to
  suppress it, so the build strips it and verifies the ESM entrypoints survived.
- **`attw --pack` on every package.** It found a real defect on introduction:
  Stencil emits `export * from '../types'` into its declarations, a directory
  specifier with no file extension, so the published types did not resolve under
  `node16`. Fixed in the build.
- `glass.css` is reachable as a standalone import, not only through `index.css`.

### Tooling

pnpm 10 + Turborepo, three-job CI, Changesets, TypeScript strict, ESLint, Prettier,
measured budgets.

### Decisions recorded

**16 of 18 ADRs exist**: 001 (Stencil over Lit, with evidence), 002 (token
pipeline, and why `style-dictionary` is not used), 003 (behavior ownership:
Web Components owns every component, React adapts, no Radix), 004 (naming,
scope, license), 005 (SSR and hydration), 008 (accessibility testing stack),
010 (budgets), 011 (scoped styles, never a shadow root), 012 (ESM-only
distribution contract and the two defects it caught), 013 (API conventions, one
question open), 014 (browser baseline), 015 (AI metadata schema, llms.txt, and
MCP packaging — including why the public surface is derived rather than
authored), 016 (RTL: logical properties, now enforced by a conformance test, and
direction-derived keyboard behavior), 017 (token values and design direction),
018 (toolchain defaults, with every deviation from §5 named), plus 019 (visual
regression). The three still missing (006, 007, 009) are deadlines for the docs
site and the CLI, neither of which exists.

ADR-003, 011, 012, 016, and 018 were cited from source — README, CONTRIBUTING,
`stencil.config.ts`, `eslint.config.js`, and the components — while the
documents did not exist. Those citations now resolve.

### Browser support matrix

`docs/browser-support.md` is **generated, not written**: a script reads the
projects out of `playwright.config.ts` and each engine's revision from the
browser Playwright will actually launch, so a browser appears in the document
only if a project launches it. A CI job fails when the document and the config
disagree, which is the only way they can drift.

The three engines were run to produce it, and this is the first time the suite
has been exercised outside Chromium: **261 tests pass on Chromium, 260 + 1 flaky
on Firefox, 261 on WebKit.** The flake is `a11y.e2e.ts` in the dark theme on
Firefox — an axe scan that passed on retry, not a behavior difference. That is a
real datapoint the matrix's predecessors could not have offered, because the
matrix did not exist and Firefox/WebKit ran only in CI.

### CLI

`@santaka-ui/cli` is the eighth publishable package, and the v1.0 workflow
surface: `init`, `add`, `list`, `doctor`, `diff`, `theme init`, `registry`, and
`update`. **37 unit tests** cover detection, path safety, the manifest, the
diff, and rollback; **18 end-to-end tests** drive the built binary in a real
subprocess against a real temporary project, because an exit code is only
observable from a process.

The three rules that shape it:

- **A run either completes or leaves nothing behind.** Writes go through a
  journal: every destination is backed up before it is replaced, and a failure
  replays the journal backwards. Verified in the e2e suite by making a later
  write fail and asserting the earlier file was restored.
- **A modified file is never overwritten without consent.** A conflict prints a
  unified diff, exits `2`, and writes nothing. `--skip` leaves the edit and the
  drift stays visible, because the manifest keeps the hash of the last bytes the
  CLI wrote rather than the bytes on disk (ADR-009).
- **The registry is untrusted, and validation is not review.** Destinations are
  confirmed inside the project root, source bytes are hashed against the entry's
  declared checksum, and `registry add` says plainly that schema validation is
  not the same as review.

A CI job runs both suites on Linux, macOS, and Windows, per §8.

### AI surface

`apps/docs/public/llms.txt` (a curated index: what the system is, the token
contract with per-group counts, the component list) and `llms-full.txt` (every
component's props with types and defaults, accessibility notes, examples, and
limitations) are generated from the registry `ai` blocks and the committed
`components.d.ts`, so neither can drift from the components. An `llms` CI job
regenerates and fails on a diff.

`@santaka-ui/mcp` is a seventh publishable package: a stdio MCP server over the
same metadata, with the four tools §11 names — `search_components`,
`get_component`, `get_tokens`, `get_usage`. No model is called and no network is
reached; the only I/O is reading the registry and the compiled token CSS at
startup. **19 unit tests** cover tool behavior, and a CI job smoke-tests the
server by driving a real MCP client over the SDK's in-memory transport pair —
which covers tool registration, input schemas, and serialization, not just the
functions.

`get_component` reports props and events that are **derived, not authored**:
props from the committed `components.d.ts`, events from the component sources
with the shared-base dispatch resolved. That second one matters — Input,
Textarea, and Select emit `sk-value-change` from `setupFormControl()`, not from
their own code, so a per-file scan reports nothing for all three.

The decisions are recorded in ADR-015.

## Not done

### Blocking Tier 1

All twelve Tier 1 components exist. The runtime budget was raised 12 → 13 KB with the rationale recorded in measure-bundle.mjs: twelve components where 12 KB covered eight, and the per-component CSS average *fell* from 2.45 to 2.11 KB.
- **No Storybook.** Section 10's workshop; nothing in the repo references it.

### Blocking Stable

- **2 ADRs missing**: 006 (docs site framework and search), 007 (registry
  hosting model). Both are deadlines for work that has not started — there is no
  docs site and no hosted registry — so those decisions have nothing to bind yet.
  The ADRs that *were* overdue are now written — see "Decisions recorded".
- ~~**No Next.js SSR proof.**~~ **Done** — `examples/nextjs` proves it (see
  ADR-005's consequences): server-rendered tags with public attributes, no
  `customElements.define` in any server chunk, clean hydration through the lazy
  loader, scoped styles applied. The fixture also forced the React JSX
  declarations to actually ship (`@santaka-ui/react/jsx`) and caught `name`
  missing from three of them.
- ~~**No visual regression in RTL.**~~ **Done** — ADR-019; a dedicated `visual`
  Playwright project photographs every example-page section in light/ltr,
  light/rtl, and dark/ltr (57 baselines), so §17's per-component RTL case is a
  property of the spec rather than a per-file promise. It is deliberately not a
  CI gate: a screenshot diff needs a reviewer, not a red build, and the
  baselines are owned by the pinned Playwright image
  (`scripts/visual-baseline-docker.mjs`), not by whoever ran
  `--update-snapshots` last.
- ~~**No `axe-core`.**~~ **Done** — ADR-008 written; axe scans the example page
  in light, dark, and invalid-submit states on every run (WCAG 2.0/2.1 A+AA,
  nothing disabled). The first run found four real defect classes, all fixed
  (separator ARIA, tablist role, nested-interactive tab, three dark-contrast
  token misuses), and added `--sk-color-primary-text` (gates 25 → 27).
- **No legal preconditions.** Trademark, npm scope, domain, mascot originality.
- **No consumer fixture.** `attw` and `publint` validate the packed tarball, but
  nothing installs the package into a scratch project and imports it.

### Unmeasured

- **`@santaka-ui/tokens + @santaka-ui/core` at ≤ 8 KB has no measurement.**
  `measure-bundle.mjs` measures compiled theme CSS, not the token package's JS or
  the core registry runtime. Recorded in ADR-010 as a gap.

### Toolchain deviations

Section 5 names four tools this repository does not use: `style-dictionary`
(reason in ADR-002), `size-limit` (replaced by `measure-bundle.mjs`, ADR-010),
`knip`, and `axe-core`. Two are recorded as decisions; two are simply absent.

### Known gaps in what shipped

- **Seven tokens have no consumer yet**: `text.display`, `text.display-sm`,
  `glass.bg-strong`, `radius.glass-lg`, `duration.overlay`, `ease.glass`,
  `duration.instant`. They are for Tier 2. The consequence is that `glass.css`
  has never been exercised end-to-end by an overlay that uses the glass easing.
- Two build scripts exist only to correct Stencil output
  (`fix-declaration-specifiers.mjs`, `strip-cjs-output.mjs`). Both document why
  Stencil cannot be configured to do it, and both fail loudly rather than
  silently skipping.

## Open decision

ADR-013 leaves one question unresolved: whether a boolean that toggles a
*presentation* rather than a state takes the `is`/`has`/`can` prefix. Three
shipped props sit on it — `sk-link.external`, `sk-link.subtle`, `sk-badge.dot`.
The conformance test enumerates them by name, so a new unprefixed presentation
boolean fails rather than inheriting the ambiguity.