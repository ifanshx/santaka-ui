---
"@santaka-ui/web-components": patch
---

Gives three components the motion the system already promised them, and makes
the motion contract enforceable.

`combobox`, `tabs`, and `pagination` all change state on interaction and all
three snapped: an audit found 21 of 38 stylesheets using the motion tokens and
17 not, with nothing distinguishing "static by design" (badge, card, separator,
label) from "someone forgot" (these three). The tokens existed and were
documented; the components that needed them were not using them.

- `combobox` — the active row now settles as `aria-activedescendant` moves under
  the arrow keys, so the highlight reads as travelling rather than as a
  different row appearing.
- `tabs` — the active tab's border, fill, and colour settle together, so
  switching reads as one position marker moving. No transform: a tab is a
  position marker, not a pressable control.
- `pagination` — the page numbers take the same arcade press language as
  Button: hover lifts the box and grows the offset shadow.

Each gains the `prefers-reduced-motion` block it needed, and
`conventions.e2e.ts` now enforces two rules across every component stylesheet:
a duration or curve must come from a token (a literal is allowed only as the
`var(--token, literal)` fallback), and anything that animates must be removable
under reduced motion. Both were negative-tested — injecting a hard-coded
`transition: background-color 250ms ease` fails the build and names the file.
