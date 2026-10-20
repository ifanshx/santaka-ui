# sk-taka



<!-- Auto Generated Below -->


## Overview

Taka — the project's optional mascot (§1.8, §13).

Behavior owner: `web-components` (section 4, Implementation ownership rule).

Three rules govern this component, and they come straight from the plan:

1. **The artwork is original.** §13: "treat the 'Taka' mascot as original
   artwork committed under the project license. Any traced or borrowed asset
   invalidates the icon/illustration license story." This is drawn here as
   paths and primitives — no imported asset, nothing traced.
2. **It is decorative, always.** A mascot is never the only carrier of
   meaning, so it renders `aria-hidden` and takes no role. The heading beside
   it does the talking; the bird is what makes the empty state feel less like
   a failure.
3. **It is reserved for onboarding, empty states, and easter eggs** — §1.8
   says "rather than every screen". `mood` exists so the same character reads
   differently in each of those places without becoming a second mascot.

`mood` also has to respect reduced motion: `wave` and `bounce` are idle
animations, and §6 requires `prefers-reduced-motion` to remove them rather
than shorten them. That is handled in the stylesheet, not here.

## Properties

| Property | Attribute | Description                                                                                                               | Type                           | Default  |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- |
| `mood`   | `mood`    | What Taka is doing. `idle` is a still portrait; the other two add an idle animation that reduced motion removes entirely. | `"bounce" \| "idle" \| "wave"` | `"idle"` |
| `size`   | `size`    | Rendered size, in the icon scale.                                                                                         | `"lg" \| "md" \| "sm"`         | `"md"`   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
