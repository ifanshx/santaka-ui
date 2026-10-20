# sk-drawer



<!-- Auto Generated Below -->


## Overview

Drawer — Tier 2 floating overlay that slides in from one edge.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A drawer is a dialog with a different shape, and the codebase already decided
how dialogs work — so this reuses `shared/dialog-base.ts` rather than writing
a second focus story. That is the whole point of the base existing. The
browser owns focus trapping, Escape, `::backdrop`, and inert background
content; nothing here reimplements them.

What is genuinely ours is the edge, and it is the part worth being careful
about:

- **`side` is logical, not physical.** `start` and `end`, never `left` and
  `right`: a document with `dir="rtl"` gets the mirrored edge for free, which
  is ADR-016's requirement rather than a preference. There is deliberately no
  physical pair — a fixed edge is exactly what puts a drawer on the wrong side
  of a right-to-left document.
- **The entrance is the glass material's float**, not the control's press
  (§2 splits motion by layer). Reduced motion removes it rather than
  shortening it.

Like the dialog, open/closed is ephemeral state the component owns outright,
so there is no `defaultOpen` — §4's rule for state the caller cannot see.
Every close path reports through one `sk-open-change`.

## Properties

| Property      | Attribute     | Description                                                                                                                                                                                      | Type               | Default |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------- |
| `dismissible` | `dismissible` | Closes when the backdrop is clicked.                                                                                                                                                             | `boolean`          | `true`  |
| `label`       | `label`       | Accessible name for the panel. The consumer's title slot supplies it best.                                                                                                                       | `string`           | `""`    |
| `modal`       | `modal`       | Modal is the default: the page behind is inert and focus is trapped. A non-modal drawer is for a persistent side panel the reader keeps open while working.                                      | `boolean`          | `true`  |
| `open`        | `open`        | Whether the drawer is showing. Reflects so page CSS can target it.                                                                                                                               | `boolean`          | `false` |
| `side`        | `side`        | Which edge it slides from.  Both values are logical and mirror under `dir="rtl"`, which is ADR-016's requirement. There is no physical pair — see the note at the top of the stylesheet for why. | `"end" \| "start"` | `"end"` |


## Methods

### `close() => Promise<void>`

Closes the drawer.

#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`

Opens the drawer. Equivalent to setting `open`.

#### Returns

Type: `Promise<void>`




## Slots

| Slot        | Description |
| ----------- | ----------- |
| `"trigger"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
