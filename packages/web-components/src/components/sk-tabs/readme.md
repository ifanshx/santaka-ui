# sk-tabs



<!-- Auto Generated Below -->


## Overview

Tabs — Tier 2, and the last v1.0 component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

The ARIA tabs pattern has one hard rule this component is built around:
**the tablist owns the keyboard**. Only the active tab is in the tab order
(roving `tabindex`); arrow keys move activation; Home/End jump to the
ends. A tablist whose tabs are all tab stops makes the user press Tab once
per tab to get past the widget — which is exactly the experience the pattern
exists to prevent.

Arrow semantics invert under RTL (§4): the direction is read from
`getComputedStyle` at interaction time, never from a build flag, so a
document with `dir="rtl"` gets Arrow-Right meaning *previous* for free.

Activation is automatic (follow focus), the ARIA Authoring Practices
default: an arrow key both moves and activates, so there is no second key
press between reading a tab and seeing its panel.

The parts communicate through DOM relationships the component computes and
writes — `aria-controls` on each tab pointing at its panel's id,
`aria-labelledby` on each panel pointing back — because tabs and panels are
separately slotted and cannot see each other at authoring time.

## Properties

| Property | Attribute | Description                                                     | Type     | Default |
| -------- | --------- | --------------------------------------------------------------- | -------- | ------- |
| `active` | `active`  | The active tab's index. Zero-based, over the tabs in DOM order. | `number` | `0`     |


## Slots

| Slot        | Description      |
| ----------- | ---------------- |
|             | The default slot |
| `"tablist"` |                  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
