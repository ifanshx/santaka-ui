---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

A tooltip is a description of something the user can already see and use, never a place where information lives. It is described, not focusable: the component wires aria-describedby from the slotted trigger to the panel, appending to a consumer's existing description rather than overwriting it. A tooltip that grabs focus is a popup wearing a tiny hat.

Two ways in, with different latencies: hover shows after a 300ms delay (a tooltip that fires instantly is a strobe), keyboard focus shows immediately (a tabbing user asked for it explicitly, and a 300ms penance on every tab is hostile). The asymmetry is also why the component exists: the title attribute never shows for keyboard users, so it cannot be the answer. The panel takes no pointer events, so hovering the tooltip never flickers it away. Escape hides it -- the one dismissal a description offers, because the tooltip is not a decision.

Two subtleties the tests caught. Stencil capture listeners see descendants: mouseleave on the button fires when the pointer moves onto its label, and without a relatedTarget boundary check the tooltip hid while the pointer was still on the trigger -- entry counts only from outside the host, departure only to outside. And the Stencil hidden manager made its third appearance, writing hidden on the open panel exactly as it did the Dialog's; the override is two-sided like the Dialog's.

placement is a hint, not a viewport-aware computation, and the registry entry says so -- the panel anchors to the trigger with logical properties and can clip at edges. Touch has no hover: also recorded, because a tooltip that is invisible on touch needs the consumer to know it before they pick it. Registry at 16 entries; runtime 14.59 KB of 15; per-component CSS 1.82 KB, still falling.
