---
"@santaka-ui/storybook": patch
---

Gives the seven component stories that had no `play` function one.

Breadcrumb, Combobox, Drawer, Link, Pagination, Popover, and Slider each had a
story file with variants but no interaction test, while thirty-one sibling stories
did. These seven are also the newest components, and several — the overlays and the
range control — are exactly where an interaction test earns its keep.

Each new `play` function asserts a contract rather than a picture: the popover's
`aria-expanded` on its slotted trigger, the slider's `aria-valuetext` carrying the
consumer's `format` pattern, the drawer's native `<dialog>` and the ARIA it
deliberately does *not* put on the trigger, pagination's `aria-current` following
the value, and the breadcrumb's and link's structural ARIA.

Two assertions are deliberately absent, and each says so in a comment. Keyboard
arrow keys on the slider and focus return on the drawer do not behave in this
Storybook environment — measured, not assumed — and both are already asserted
against real Chromium in the Playwright suite. An assertion that fails for an
environment reason rather than a product reason is worse than no assertion.
