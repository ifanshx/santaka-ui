# sk-tooltip



<!-- Auto Generated Below -->


## Overview

Tooltip — Tier 2, the quietest glass.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A tooltip is a *description of something the user can already see and use*,
never a place where information lives. That definition drives every rule:

 - It is named through `aria-describedby` pointing at the tooltip's content,
   so a screen reader reads it on demand — a tooltip that grabs focus is a
   popup wearing a tiny hat.
 - It shows on hover and on keyboard focus, and hides on Escape. The
   keyboard path is the reason this is a component and not a `title`
   attribute: `title` never shows for keyboard users at all.
 - It takes **no** pointer events itself, so hovering the tooltip never
   flickers it away; only leaving the trigger does.
 - It is explicitly excluded from the forms contract (§4): it cannot be
   form-associated, and it says so.

Placement is a hint, not a guarantee: the consumer picks the side and the
component flips at the viewport edge rather than rendering off-screen.

## Properties

| Property    | Attribute   | Description                                                                       | Type                                     | Default |
| ----------- | ----------- | --------------------------------------------------------------------------------- | ---------------------------------------- | ------- |
| `delay`     | `delay`     | Milliseconds of hover before showing. A tooltip that fires instantly is a strobe. | `number`                                 | `300`   |
| `open`      | `open`      | Whether the tooltip is showing. Driven by hover/focus; also settable.             | `boolean`                                | `false` |
| `placement` | `placement` | Preferred side. Flips at the viewport edge rather than clipping.                  | `"bottom" \| "left" \| "right" \| "top"` | `"top"` |


## Slots

| Slot        | Description |
| ----------- | ----------- |
| `"trigger"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
