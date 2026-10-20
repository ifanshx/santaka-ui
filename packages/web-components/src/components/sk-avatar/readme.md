# sk-avatar



<!-- Auto Generated Below -->


## Overview

Avatar — Tier 1 display component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

An avatar is a picture of a person, and that makes it *meaningful* rather
than decorative. A decorative image takes `alt=""`; this one is the person's
name as far as a screen-reader user is concerned. That framing decides three
things this component does deliberately:

1. **The host is the accessible image, not the `<img>`.** `role="img"` with
   the person's name as its label, and the `<img>` inside is `alt=""`. The
   alternative — putting the name on the `<img>` — leaves the initials span
   as a second, competing text node in the same box.
2. **An avatar with no name and no image carries no information**, so it gets
   `aria-hidden` instead of an empty `role="img"`. An unnamed image is an axe
   violation (`role-img-alt`), and the tempting fix — defaulting the label to
   something like "avatar" — is worse: it announces a word the designer
   wrote, not the person's name.
3. **`data-state` distinguishes why initials are showing.** "No image",
   "still loading", and "the image 404'd" look identical in review and are
   three different bugs. The attribute names which, so a screenshot diff and
   a test can both tell them apart.

The initials are derived from `name`, never supplied separately. Two fields
that can disagree are how an avatar shows "JD" while announcing "Jane Doe".

The shape is a circle, which is a deliberate departure: chrome in this system
is hard-edged at zero radius (ADR-017), but a portrait is not chrome. A
square with no radius reads as a cropped document rather than a person.

## Properties

| Property | Attribute | Description                                                                                                                       | Type                   | Default |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------- |
| `name`   | `name`    | The person's name. It is the accessible name of the image and the source of the initials — one field, so the two cannot disagree. | `string`               | `""`    |
| `size`   | `size`    | Diameter. An avatar is square by ratio, so `size` is one axis.                                                                    | `"lg" \| "md" \| "sm"` | `"md"`  |
| `src`    | `src`     | Image source. Without it, the initials render.                                                                                    | `string`               | `""`    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
