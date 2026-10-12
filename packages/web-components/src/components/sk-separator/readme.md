# sk-separator



<!-- Auto Generated Below -->


## Overview

Separator — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

It renders a real `<hr>` because that is the semantic: a thematic break
between content, announced by screen readers unless the consumer says it is
purely visual. `decorative` flips it to `role="none"` — the same ruling
ARIA APG makes for separators that exist only for the eye.

The line is the hairline token (`border.width`), not the 3px chrome stroke:
a separator divides content, and a 3px stroke between paragraphs would read
as a wall. Its geometry is the one place this system uses the hairline
deliberately.

## Properties

| Property      | Attribute     | Description                                                                                                                                                                          | Type                         | Default        |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | -------------- |
| `decorative`  | `decorative`  | Purely visual: removes the element from the accessibility tree. Set it whenever the surrounding structure — a heading, whitespace, a card boundary — already communicates the break. | `boolean`                    | `false`        |
| `label`       | `label`       | Label for a meaningful separator, e.g. "or" between two actions. Announced only when the separator is not decorative, because a name on a `role="none"` element is a contradiction.  | `string`                     | `""`           |
| `orientation` | `orientation` | Axis of the line. Vertical separators need a sized parent.                                                                                                                           | `"horizontal" \| "vertical"` | `"horizontal"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
