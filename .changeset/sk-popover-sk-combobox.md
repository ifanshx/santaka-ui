---
"@santaka-ui/web-components": minor
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/svelte": minor
---

Adds `sk-popover` and `sk-combobox` — the last two of the components named in the
plan's Tier 2 that had not shipped. The registry now carries 38 entries.

**Popover** holds interactive content, which is what makes it not a tooltip: a
tooltip describes and takes no focus, while a popover takes focus, closes on
Escape and on an outside click, and returns focus to its trigger. So `role="dialog"`
on the panel, `aria-haspopup` + `aria-expanded` on the trigger, and deliberately
**no** `aria-describedby` — which would announce the whole panel as the trigger's
description.

Its first implementation was discarded and rebuilt. The original created the panel
imperatively and relocated the consumer's children into it, which broke twice: the
rendered `<slot name="trigger">` was itself a child of the host, so moving
children took the trigger with them; and a click on slotted content reported the
*original* node, outside the host, so the popover closed on its own contents. The
rebuild renders a real `<div>` with a real `<slot>`, so nothing is relocated, and
drives visibility from `data-open` on the host rather than `hidden` on the panel —
scoped mode writes `hidden` onto elements hosting a `<slot>`, which had left an
open panel both invisible and unfocusable.

**Combobox** implements the ARIA 1.2 pattern, and the load-bearing detail is that
**focus never leaves the input**: the active option is reported through
`aria-activedescendant` instead. Moving focus into the list is the common mistake —
it blurs the field the reader is typing into and every screen reader announces it
as leaving. Arrows wrap rather than dead-ending, and Escape closes without
clearing, because closing is not the same command as reverting. `sk-value-change`
fires only for a committed selection; typing filters and is not a value change
(§4).

Coverage: 8 browser tests for Popover and 11 for Combobox, both negative-tested —
disabling the outside-click check fails the "clicking inside does not dismiss it"
test, and removing `aria-activedescendant` fails three.

One test was flaky and was fixed at its cause rather than retried: reading
`aria-activedescendant` immediately after a keypress raced the `@State` render and
saw null about half the time. It now waits for the attribute. Verified with
`--repeat-each=10 --retries=0`: 110 passed, 0 failed.

The runtime budget moves 26 → 28 KB; ADR-026 records the measurement (0.79 KB per
component, the steepest yet) and sets a rule the earlier raises did not: the next
raise should check whether the shared bases are growing, not just the count.
