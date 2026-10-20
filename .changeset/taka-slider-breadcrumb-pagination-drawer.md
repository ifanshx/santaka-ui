---
"@santaka-ui/web-components": minor
"@santaka-ui/core": minor
---

Adds five components: `sk-taka`, `sk-slider`, `sk-breadcrumb`, `sk-pagination`,
and `sk-drawer`.

**Taka** is the project's mascot (§1.8, §13), drawn here as SVG paths and
primitives rather than imported as an asset — §13 requires original artwork, and
a traced or borrowed asset would invalidate the illustration license story. It is
decorative everywhere: `aria-hidden` on the host, `role="presentation"` on the
`<svg>`. `mood` adds an idle animation that `prefers-reduced-motion` removes
outright rather than shortening.

**Slider** is a real `<input type="range">`, which is the whole decision: the
platform owns the keyboard model, step rounding, the slider role, and
`aria-valuenow`. Reimplementing those is where hand-built sliders lose focus and
screen-reader support. `ElementInternals` reports validity only — the value has
one owner, as §4 requires. `aria-valuetext` takes a consumer-supplied `format`
string, because §6 says locale is consumer-supplied.

**Breadcrumb** is `<nav aria-label="Breadcrumb">` wrapping an `<ol>`, with
`aria-current="page"` on the last item and no link on it — a link to the page you
are on is a no-op that reads as actionable. Separators are drawn with `::before`
and carry no text, so nothing announces "slash, slash, slash".

**Pagination** computes the window rather than leaving it to each consumer. Page
numbers are links because a page is a destination; the current one is
`aria-current` and not a link; the ellipsis is empty, hidden, and not a stop;
Prev/Next carry visually hidden words, since "‹" alone announces as punctuation.

**Drawer** reuses `shared/dialog-base.ts` instead of writing a second focus
story. `side` is logical — `start` and `end`, which mirror under `dir="rtl"`
(ADR-016). There is deliberately **no** physical `left`/`right` pair: ADR-016
bans those properties in component CSS, and a fixed edge is exactly what puts a
drawer on the wrong side of a right-to-left document.

Coverage: 6 browser tests for Taka, 8 for Slider, 5 for Breadcrumb, 9 for
Pagination, 7 for Drawer. Slider and Drawer were negative-tested — replacing the
native range input fails three tests, and removing the `[hidden][open]` rule
leaves the drawer open but invisible.

**Not included:** a Popover was built and then removed rather than shipped
half-working. Its focus and outside-click contracts did not hold under
Stencil's slot management, and leaving red tests in the suite would have blocked
`verify` and CI. It needs a fresh attempt with the panel-content model worked
out first.

The runtime budget moves 23 → 26 KB to accommodate these; ADR-026 records the
measurement and notes that the per-component delta rose to 0.51 KB because
`sk-drawer` is the first addition to consume a shared base.
