# sk-accordion-item



<!-- Auto Generated Below -->


## Overview

Accordion item — one disclosure panel inside an `sk-accordion`.

A real native `<details>`/`<summary>` pair, for the reason sk-dialog uses the
native `<dialog>`: the browser already owns the semantics, the focus
behaviour and Enter/Space activation, and a JavaScript reimplementation of
that is a second, worse one.

Known limitation, recorded rather than half-implemented: the ARIA APG
accordion pattern adds roving arrow-key movement between summaries, and
native `<details>` has never had it. Enter and Space are the platform's, the
focus stop is the platform's, and arrow-key navigation is not built here.

## Properties

| Property  | Attribute | Description                                                                                                                                                                                                                                                                                                                                     | Type      | Default |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `heading` | `heading` | The summary text.  A `<span>` inside the `<summary>`, not a heading element: the item does not know what level it sits at in the document outline, and a hard-coded heading inside it contradicts the surrounding structure (sk-card's stated reason for the same shape).                                                                       | `string`  | `""`    |
| `open`    | `open`    | Whether the panel is expanded. Mirrors `<details open>` and is reflected: a consumer can author `<sk-accordion-item open>` in HTML — including server-rendered markup for an already-expanded item — and the attribute tracks what the browser did on a user toggle, so the parent can close siblings and the consumer can read the real state. | `boolean` | `false` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
