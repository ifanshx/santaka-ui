# sk-banner



<!-- Auto Generated Below -->


## Overview

Banner — a page-level message that sits above the content it is about.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A banner and an alert look alike and are not the same thing, so the
difference is the first thing recorded here:

- **`sk-alert` is inline.** It renders in the document flow, pushes content
  down, and belongs to the section it describes.
- **`sk-banner` is regional.** It spans the width of its container and sits
  *above* the content, which is why it is the component for site-wide
  notices — maintenance windows, a degraded service, an expired trial.

That difference decides the ARIA. A banner that spans the page is a landmark,
so the role is `region` rather than a live region: **`role="banner"` is not
used**, because in ARIA that name means the site header and is reserved for
one element per page — putting it here would collide with the consumer's real
`<header>` and leave two "banner" landmarks. `region` with an accessible name
is the correct shape, and it is only a landmark once it is named, which is
why `aria-label` or `aria-labelledby` is required for the landmark role to
apply at all.

It is **not** announced as an interruption. An alert interrupts because it
appeared in reaction to something the user just did; a banner was already
there when the page loaded, and announcing it as an interruption would talk
over the content the user came for. Consumers who need an interruption should
use `sk-alert` or `sk-toast`, which own those contracts.

Like `sk-alert`, it has no dismiss button. Dismissing is a different
component: it needs a close affordance, focus into it, and a focus return
when the banner goes away.

## Properties

| Property    | Attribute    | Description                                                                                                                                                                                                                                                   | Type                                                           | Default     |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `fullWidth` | `full-width` | Whether the banner spans its container as a full-width strip.  `false` keeps it in the flow as a block with the standard chrome, for a message about one section rather than the whole page.                                                                  | `boolean`                                                      | `true`      |
| `heading`   | `heading`    | Heading text. Named `heading`, not `title`, for the reason `sk-alert` records: `title` is a standardized `HTMLElement` member, so a prop by that name is shadowed by the prototype and the browser would surface it as a hover tooltip over the whole banner. | `string`                                                       | `""`        |
| `variant`   | `variant`    | Visual emphasis.                                                                                                                                                                                                                                              | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` |


## Slots

| Slot        | Description      |
| ----------- | ---------------- |
|             | The default slot |
| `"actions"` |                  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
