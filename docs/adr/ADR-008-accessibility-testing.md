# ADR-008: Automated accessibility checking with axe-core

- **Status:** Accepted
- **Date:** 2026-10-14
- **Plan deadline:** end of weeks 5–6 (`plan.md` §18)

## Context

`plan.md` §12 lists accessibility as a test layer and names `axe-core` +
`@axe-core/playwright` as the stack; §17 makes "automated accessibility checks"
a release-readiness item. Until now no automated scan ran: accessibility was
covered by the per-component browser tests, which assert *behavior* (focus
wiring, keyboard flow, `aria-invalid`, label association) but never re-check
the whole rendered page. A contrast regression, a missing `role`, or an ARIA
attribute that a re-render dropped would pass every existing suite.

## Decision

**axe-core runs in the Playwright suite over the vanilla example page, in three
states: light theme, dark theme, and after an invalid form submit.**

- `e2e/a11y.ts` is the shared helper: `AxeBuilder` pinned to
  `withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])` so an axe release
  that adds rules cannot silently change what "passing" means.
- `e2e/a11y.e2e.ts` scans the whole page — which mounts every component in its
  documented states — so a violation names a shipped component, not a fixture.
  Nothing is disabled: if a rule fires, the component is wrong or the markup
  is wrong.
- The scan waits for `.hydrated` before analyzing: an inert custom element
  renders no label wiring, and axe would report violations the upgraded
  element does not have.
- The invalid-submit state is scanned because it is where contrast and label
  wiring matter most, and the state a rest-state scan never sees.

### What axe does and does not certify

axe covers what a rule can check: names, contrast, ARIA structure and
permitted attributes, landmark hygiene. It cannot check keyboard *flow*,
focus order, or screen-reader output. `plan.md` §12's honesty requirement
stands: the per-component browser tests remain the keyboard-and-behavior
evidence, and axe is the regression net, not the certificate. A component
passes neither on axe alone nor on behavior tests alone.

## Evidence: what the first run found

The first scan failed on four classes of real defect, each fixed rather than
rule-disabled:

1. **`sk-separator` emitted `aria-orientation` on `role="none"`.** An ARIA
   attribute on an element that has left the accessibility tree is a
   contradiction (`aria-allowed-attr`). The decorative case now declares
   nothing but the role.
2. **`sk-tabs` never assigned `role="tablist"`** to the consumer-authored
   slot wrapper, so every `role="tab"` was an orphan (`aria-required-parent`).
   The widget's sync pass assigns the role, so a consumer cannot forget it.
3. **`sk-tab` nested a real `<button>` inside `role="tab"`**
   (`nested-interactive`). The host is now the tab: no inner button, the
   widget owns Enter/Space activation (two extra key handlers) plus the
   arrows it already owned. The earlier "free platform button" benefit came
   bundled with a violation that is not negotiable.
4. **Three contrast failures on dark theme** (`color-contrast`):
   `--sk-color-danger` (4.09:1 on dark surface) was used as *text* for error
   and required markers — `--sk-color-danger-fg` exists for exactly that and
   is used by input/select already; checkbox, switch, radio-group, textarea,
   and one `color-mix()` override in input that *downgraded* the base rule
   were inconsistent. And `--sk-color-primary` (3.39:1 on dark surface) was
   used as *text* for ghost button labels and links — it is a surface color.
   A new **`--sk-color-primary-text`** token (dark: `violet.400`, 7.09:1)
   carries primary-colored text, gated at 4.5:1 in the token build.

The example page's toast region also carried `aria-label` on a role-less
`div` — fixture markup, fixed with `role="region"`.

## Consequences

- The token build now checks 27 contrast pairs (was 25): the two
  `color.primary-text` gates.
- Error and required-marker text across every form control uses
  `--sk-color-danger-fg`; the `danger` token is for surfaces and strokes.
- `sk-tab` has no inner button; its public CSS hook is the host
  (`sk-tab.sk-tab__button`), and its tests click and focus the host.

## What would reverse this

If axe's WCAG tags prove too strict for a legitimate pattern — a rule that
fires on a defensible design — the finding is argued in an ADR amendment with
the pattern's evidence, not silenced with `disableRules` in the helper. A
disabled rule in the shared helper would be a budget raised in secret.
