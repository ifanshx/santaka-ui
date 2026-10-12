# sk-card



<!-- Auto Generated Below -->


## Overview

Card — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

A card is a surface, not a control. It owns no state, exposes no role, and is
not focusable — a clickable card is a link or a button with a card's styling
on it, and pretending otherwise produces a thing that is neither reachable by
keyboard nor announced. The registry entry for this component says so, and it
is the reason this component has no interaction props at all.

Composition follows §4: Web Components use named slots. So the parts are
`header`, the default slot for the body, and `footer`, each optional, and each
rendered only when the consumer actually filled it — an empty bordered header
is worse than no header.

## Properties

| Property   | Attribute  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Type                                | Default     |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| `heading`  | `heading`  | Heading text for the card, rendered in the header.  Named `heading`, not `title`. `title` is a standardized `HTMLElement` member, and a prop by that name shadows the prototype property, so the browser would show this text as a hover tooltip on the entire card — a second, invisible copy of the heading appearing on hover. Stencil warns about this by name.  A string rather than a heading element: the card does not know what level it sits at in the document's outline, and a hard-coded `<h3>` inside a card in an `<h2>` section produces a heading level that contradicts the surrounding structure. A consumer who needs a real heading passes one in the `header` slot instead. | `string`                            | `""`        |
| `padding`  | `padding`  | The card's inner padding.  Not the `size` prop, because `size` is the height scale every other component uses and a card has no intrinsic height: it is whatever its content makes it. Padding is the axis a card actually varies on.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `"lg" \| "md" \| "none" \| "sm"`    | `"md"`      |
| `subtitle` | `subtitle` | Supporting text under the heading.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `string`                            | `""`        |
| `variant`  | `variant`  | Visual emphasis.  `default` is the raised, hard-edged surface every other chrome component matches. `outlined` drops the fill for a card that sits inside another surface, where two competing fills would fight. `bare` drops the shadow too, for a card that is grouped rather than elevated.                                                                                                                                                                                                                                                                                                                                                                                                   | `"bare" \| "default" \| "outlined"` | `"default"` |


## Slots

| Slot       | Description      |
| ---------- | ---------------- |
|            | The default slot |
| `"footer"` |                  |
| `"header"` |                  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
