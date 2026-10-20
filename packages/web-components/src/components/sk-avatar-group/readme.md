# sk-avatar-group



<!-- Auto Generated Below -->


## Overview

Avatar Group — Tier 1 display component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A stacked row of avatars, with the overflow collapsed into a count. Three
decisions make this more than a flex wrapper:

1. **The overflow count is text, not another avatar.** "+3" is not a person,
   so rendering it as a fourth circle invites a reader to think it is one —
   and it has no name to announce. It is a `<span>` with a real accessible
   name built from the count, not an unnamed circle.
2. **The group is a `group`, not a `list`.** These are people, not items to
   navigate. A `list` would make a screen reader announce "list, 4 items" and
   walk the reader through each one, when the useful information is one
   sentence: "Ada Lovelace, Grace Hopper, and 2 others".
3. **Overlap is visual, not structural.** The stack is drawn with a negative
   inline margin on every avatar after the first. Nothing is absolutely
   positioned, so the group reflows at narrow widths and mirrors in RTL —
   `margin-inline-start` is what flips, not a `left` offset.

The avatars are slotted `sk-avatar` elements rather than a data array. A
`people={[...]}` prop would be a second, competing way to render a person and
would put name/initials/label logic in two places — the duplication that made
`sk-avatar` derive initials from `name` rather than accept them.

## Properties

| Property | Attribute | Description                                                                                                                                                                                     | Type                   | Default |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------- |
| `label`  | `label`   | The accessible name for the group — "Assigned to", "Contributors". A bare `role="group"` with no label is skipped by most screen readers, so the label is what makes the group announce at all. | `string`               | `""`    |
| `max`    | `max`     | How many avatars to show before collapsing the rest into a count. `0` means show all.                                                                                                           | `number`               | `3`     |
| `size`   | `size`    | Diameter applied to every avatar in the group.                                                                                                                                                  | `"lg" \| "md" \| "sm"` | `"md"`  |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
