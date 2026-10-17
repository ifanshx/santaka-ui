# sk-table



<!-- Auto Generated Below -->


## Overview

Table — a skin over a table the consumer authors, not a table builder.

The consumer writes a real `<table>` with its own `<caption>`, `<thead>`,
`<th scope="col">` and `<tbody>`; this component contributes the container,
the horizontal overflow handling, and the brutalist style. It takes the same
position `sk-card` takes toward its content: it styles a surface, it does not
invent the markup inside it. There is no column config, no data prop, and no
cell rendering — the consumer's real table semantics are the component's
accessibility story, not something to reimplement.

KNOWN LIMITATION: sticky headers are not implemented. The scroll container's
height belongs to the consumer (set `block-size` on it yourself); a
`position: sticky` header only works once that height is constrained, and the
component cannot assume one. A consumer who constrains the height may add
`sk-table thead th { position: sticky }` from their own CSS.

## Properties

| Property  | Attribute | Description                                                                                                                                                                                                                                                                                                                                                             | Type                     | Default     |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------- |
| `density` | `density` | Cell padding, not a height scale. `size` is the height scale every other component uses and a table has no intrinsic height — it is whatever its rows make it. Density is the axis a table actually varies on, and its default value is named for what it is rather than for a comfort level: `default` matches `variant`, and a table that wants tighter rows opts in. | `"compact" \| "default"` | `"default"` |
| `label`   | `label`   | The name of the scroll region.  The viewport is focusable (`tabindex="0"`) because a scrollable region that cannot be reached from the keyboard is unreachable content (WCAG 2.1.1). With a label it also carries `role="group"` and an accessible name; with none it carries no role at all — an unnamed group is noise in the accessibility tree, not structure.      | `string`                 | `""`        |
| `striped` | `striped` | Zebra rows: even body rows take the sunken surface.                                                                                                                                                                                                                                                                                                                     | `boolean`                | `false`     |
| `variant` | `variant` | `default` is the stroked, shadowed container; `plain` drops the container chrome for a table sitting inside a `sk-card`.                                                                                                                                                                                                                                                | `"default" \| "plain"`   | `"default"` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
