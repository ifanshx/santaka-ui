# sk-spinner



<!-- Auto Generated Below -->


## Overview

Spinner — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

The visual is lifted from Icon Button's loading state, deliberately: two
components drawing the same ring two different ways is how a design system
drifts. If the spinner's look changes, it changes in both places or the
difference is a bug.

Accessibility is the part that is easy to get wrong, so it is decided here
rather than left to the consumer:

 - The element carries `role="status"`, so a screen reader announces it as a
   live region rather than skipping it as decoration.
 - The visible ring gets `aria-hidden="true"` — it is a picture of waiting,
   and the words are what get announced.
 - `label` defaults to "Loading". A spinner with no text is a picture of
   nothing to a screen reader; the type system makes omitting the words a
   choice the consumer has to make, not an accident.

## Properties

| Property | Attribute | Description                                                                                                                                                                         | Type                   | Default     |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `label`  | `label`   | What the wait is, announced to screen readers in place of the silent ring. "Loading" is the honest default; "Saving draft…" is the better one.                                      | `string`               | `"Loading"` |
| `size`   | `size`    | Ring diameter, from the icon-size tokens so the spinner matches the icon beside it. Not the `size` prop's height scale: a spinner is a circle, and a circle's size is its diameter. | `"lg" \| "md" \| "sm"` | `"md"`      |
| `status` | `status`  | Announces progress when it is known, e.g. "Uploading 60%".                                                                                                                          | `string`               | `""`        |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
