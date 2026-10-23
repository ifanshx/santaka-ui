---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

Universal (behavior owner, per section 4):
- SkSwitch: the Checkbox boolean path under role=switch — a real native
  input owns FACE, Space-to-toggle, and validation while AT reads on/off.
  Brutalist track-and-thumb, data-state attribute, arcade thumb slide.
- SkRadioGroup: real native radios in a radiogroup; group-level FACE —
  one ElementInternals, the checked radio's value submitted, required
  validated by the browser. Options via the Select JSON contract. The
  browser owns arrow keys and the single tab stop.
- Barrel + COMPONENTS + registry entries (21 components).

React:
- Switch and RadioGroup adapters, JSX intrinsics, 23 contract tests.
- Fixed a real Checkbox adapter defect: onValueChange read
  event.target.checked from the host (which has none) instead of
  event.detail.checked — it always reported false.

Guard:
- New barrel-export contract test, the guard the sk-select bug bought:
  every component directory must be exported, listed in COMPONENTS, and
  have a registry entry. It caught sk-label missing from COMPONENTS.

Tests: 35 new Playwright tests (18 switch, 17 radio); runtime budget
17 -> 18 KB recorded in measure-bundle.mjs and ADR-010 (1.13 KB for both
components combined, per-component CSS average fell 2.45 -> 2.24 KB).
Mount helpers moved to HTML-entity escaping; backslash-escaped JSON
quotes truncate the attribute at [{\\ and render zero options.
