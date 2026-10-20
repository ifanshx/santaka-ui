# sk-breadcrumb



<!-- Auto Generated Below -->


## Overview

Breadcrumb — Tier 2 navigation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

The ARIA shape is the whole reason this is a component rather than a row of
links:

1. **`<nav>` with `aria-label="Breadcrumb"`, and an `<ol>` inside.** The nav
   makes it a landmark a screen reader can jump to; the list is what makes it
   announce "list, 3 items" so the reader knows there is a hierarchy rather
   than three unrelated links.
2. **The current page is `aria-current="page"`, not a link.** A link to the
   page you are already on is a no-op that reads as actionable. Marking it is
   what distinguishes "where you are" from "where you came from".
3. **The separators are decorative and hidden.** Drawn in CSS with
   `aria-hidden`, so a reader does not announce "slash, slash, slash" between
   the items. A `<span>/</span>` between every item is the common mistake.

The items come from an `items` array rather than slotted children, because the
component has to know which one is last — that is what `aria-current` hangs
off, and a slot cannot tell you how many nodes it received without walking
them at runtime.

## Properties

| Property | Attribute | Description                                                                                                                                                                                              | Type                                                         | Default        |
| -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------- |
| `items`  | `items`   | The trail, oldest first — the last entry is the current page.  A JSON array of `{ label, href? }`. `href` is optional precisely because the last item normally has none: the current page is not a link. | `string \| { label: string; href?: string \| undefined; }[]` | `"[]"`         |
| `label`  | `label`   | Accessible name for the landmark. Defaults to "Breadcrumb".                                                                                                                                              | `string`                                                     | `"Breadcrumb"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
