# sk-pagination



<!-- Auto Generated Below -->


## Overview

Pagination — Tier 2 navigation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

Four decisions, all of them about what a screen reader hears:

1. **`<nav>` with `aria-label`, and the page numbers are links.** Pagination is
   navigation, so it is a landmark; the numbers are `<a href>` because a page
   is a destination, and a `<button>` would misdescribe it as an action.
2. **The current page carries `aria-current="page"`, and is `aria-disabled`
   rather than a dead link.** A link to the page you are on is a no-op that
   reads as actionable.
3. **The ellipsis is decorative and hidden.** "…" is not a page. Rendered as
   an empty `<span>` with `aria-hidden`, so it is not announced as a stop and
   is not focusable.
4. **Prev and Next keep real accessible names.** "‹" alone announces as a
   punctuation mark, so each carries a visually hidden word alongside the
   glyph.

The window is computed here rather than left to the consumer: `count` and
`page` are the inputs, and which pages to show with ellipses is the part every
consumer reimplements badly.

§4's event rule: `sk-page-change` fires only for user-initiated changes, never
when `page` is updated programmatically, which is what keeps a controlled
pager from looping.

## Properties

| Property   | Attribute  | Description                                                                                                    | Type     | Default        |
| ---------- | ---------- | -------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| `count`    | `count`    | Total number of pages.                                                                                         | `number` | `1`            |
| `href`     | `href`     | Builds the href for a page number. `$p` is replaced with the page.                                             | `string` | `""`           |
| `label`    | `label`    | Accessible name for the landmark.                                                                              | `string` | `"Pagination"` |
| `page`     | `page`     | The current page, 1-based.                                                                                     | `number` | `1`            |
| `siblings` | `siblings` | How many page numbers to show between the ellipses. Small enough that the row never wraps on a 320px viewport. | `number` | `1`            |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
