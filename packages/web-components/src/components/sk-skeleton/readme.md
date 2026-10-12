# sk-skeleton



<!-- Auto Generated Below -->


## Overview

Skeleton — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A skeleton is a promise about layout: it exists so that when real content
arrives, nothing shifts. That makes its dimensions the entire feature, which
is why they are set by the consumer rather than inferred — a skeleton that
guesses the content's height is the cause of the layout shift it exists to
prevent.

Two accessibility decisions, both the opposite of the Spinner's:

 - It is `aria-hidden="true"` and takes no role. A skeleton is scaffolding,
   not content; announcing "grey rectangle" five times before a table loads
   is noise. The real content announces itself when it arrives.
 - There is no `label` prop, on purpose. If a region needs an announcement
   while it loads, that is a live region's job and the consumer owns it.

## Properties

| Property    | Attribute   | Description                                                                                                                                                                                                                               | Type                           | Default  |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- |
| `direction` | `direction` | The shimmer's direction. Reversed for a right-to-left reading context, set by the consumer because the component does not know its locale.                                                                                                | `"ltr" \| "rtl"`               | `"ltr"`  |
| `variant`   | `variant`   | The shape being promised. `text` is a full-width line with the body line height, `circle` is a square bounding box with the full radius (a shape, not a style — same ruling as the Badge dot), `rect` is whatever box the consumer sizes. | `"circle" \| "rect" \| "text"` | `"text"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
