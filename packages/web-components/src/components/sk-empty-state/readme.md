# sk-empty-state



<!-- Auto Generated Below -->


## Overview

Empty state — Tier 1 placeholder surface.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

Like sk-card, this is a surface, not a control: it owns no state, exposes no
role, and is not focusable. The section outline is the document's business —
the consumer labels the section with a real heading and this component
renders plain text, for the same reason sk-card's heading is a `<span>`.

`variant="bare"` exists for an empty state that sits inside a card: the card
already draws the boundary, and a second stroke with its own shadow inside it
is two competing surfaces fighting for the same wall.

## Properties

| Property      | Attribute     | Description                                                                                                                                                                                                                            | Type                   | Default     |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `description` | `description` | Supporting text under the heading.                                                                                                                                                                                                     | `string`               | `""`        |
| `heading`     | `heading`     | Plain text in a `<span>`, not a heading element. This component does not know what level it sits at in the document's outline, and a hard-coded heading inside it contradicts the surrounding structure. Decision shared with sk-card. | `string`               | `""`        |
| `size`        | `size`        | Density axis: block padding and glyph size. `md` is the default because an empty state usually fills the whole area left by the missing content.                                                                                       | `"lg" \| "md" \| "sm"` | `"md"`      |
| `variant`     | `variant`     | Visual treatment.  `default` is the stroked, shadowed surface. `bare` drops the fill, the stroke and the shadow for an empty state nested inside another surface, where two competing boundaries would fight.                          | `"bare" \| "default"`  | `"default"` |


## Slots

| Slot        | Description      |
| ----------- | ---------------- |
|             | The default slot |
| `"actions"` |                  |
| `"icon"`    |                  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
