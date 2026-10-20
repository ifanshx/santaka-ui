# sk-popover



<!-- Auto Generated Below -->


## Overview

Popover — Tier 2 floating layer that holds interactive content.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

**The distinction that makes this not a tooltip.** A tooltip is a description
of something the reader can already see and use; it is named through
`aria-describedby`, takes no focus, and holds no interactive content. A popover
holds controls — a menu, a filter, a form — so it needs the opposite contract
on all three counts:

1. **It is a dialog, labelled by its own heading or `label`.** The trigger gets
   `aria-haspopup="dialog"` and `aria-expanded`, not `aria-describedby` —
   announcing a menu as the trigger's description reads the whole thing out as
   one sentence.
2. **It dismisses on Escape and on an outside click**, and returns focus to the
   trigger. A tooltip disappears when you look away; a popover has to be
   *closed*, because it owns focus while it is open.
3. **Slot content is not moved.** The panel is rendered by Stencil with real
   `<slot>` elements rather than built imperatively and filled by relocating
   the consumer's children. Relocation is what broke the first attempt: the
   rendered `<slot name="trigger">` was itself a child of the host, so moving
   children took the trigger with them, and a click on slotted content reported
   the original node — outside the host — so the popover closed on itself.

Placement is a hint, not a guarantee: the component flips at the viewport edge
rather than rendering off-screen, the same rule the tooltip follows.

## Properties

| Property    | Attribute   | Description                                                                                                                                      | Type                                    | Default    |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ---------- |
| `label`     | `label`     | Accessible name for the panel, needed when there is no visible heading.                                                                          | `string`                                | `""`       |
| `open`      | `open`      | Whether the popover is showing. Reflects so page CSS can target it.                                                                              | `boolean`                               | `false`    |
| `placement` | `placement` | Preferred side. Flips at the viewport edge rather than clipping, so a `bottom` popover on a trigger near the bottom of the screen renders above. | `"bottom" \| "end" \| "start" \| "top"` | `"bottom"` |


## Methods

### `hide() => Promise<void>`

Closes the popover and returns focus to the trigger.

#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`

Opens the popover.

#### Returns

Type: `Promise<void>`




## Slots

| Slot        | Description      |
| ----------- | ---------------- |
|             | The default slot |
| `"trigger"` |                  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
