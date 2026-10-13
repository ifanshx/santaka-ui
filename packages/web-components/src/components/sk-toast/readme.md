# sk-toast



<!-- Auto Generated Below -->


## Overview

Toast — Tier 2, non-blocking glass.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A toast is the opposite of a dialog and the opposite of a Skeleton, in the
same way those two are opposites of each other. A dialog interrupts; a toast
must not. A skeleton hides from the accessibility tree; a toast must be
announced — its whole job is to tell the user something happened while they
were looking somewhere else.

So: `role="status"` (a polite live region), not `alert`. The message is
announced when it appears and never re-announced; a toast that shouts is a
dialog wearing a smaller skirt. Duration is the consumer's decision, with a
pause on hover and on focus — a live region that disappears mid-read is an
announcement that never happened.

Unlike the dialogs, the toast renders its own panel inline (no native
`<dialog>`, no focus capture — it never takes focus at all) and stacks via
the `--sk-z-toast` layer. Placement is the *page's* concern: the consumer
positions a region and drops toasts into it, which is why this component is
a single toast and not a toaster.

## Properties

| Property   | Attribute  | Description                                                                                                                                | Type                                              | Default     |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ----------- |
| `duration` | `duration` | Milliseconds before auto-dismiss. `0` never auto-dismisses — for an error the user must act on, an expiring message is an expired apology. | `number`                                          | `5000`      |
| `open`     | `open`     | Whether the toast is showing.                                                                                                              | `boolean`                                         | `false`     |
| `variant`  | `variant`  | Visual severity, matching Badge's palette. Color is never the message.                                                                     | `"danger" \| "neutral" \| "success" \| "warning"` | `"neutral"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
