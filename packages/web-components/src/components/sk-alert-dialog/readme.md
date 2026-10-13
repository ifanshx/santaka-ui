# sk-alert-dialog



<!-- Auto Generated Below -->


## Overview

Alert Dialog — Tier 2, and the reason the dialog mechanics were extracted
rather than copied.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

An alert dialog is a dialog that asks a question the page cannot continue
without: the decision is forced, and interruption is the *point*. Three
properties follow from that definition, and each one is a removal from
`sk-dialog`:

 - `role="alertdialog"`, so assistive technology announces it as an
   interruption rather than as a window.
 - **No dismissal**: no `dismissible` prop, no backdrop click, and Escape is
   refused. A user cannot decline to answer — they must choose an action.
   This is the ARIA APG's requirement for the role, not a style choice.
 - **No trigger slot.** An alert is raised by the application in response to
   something, never opened by the user browsing; a "click to see the
   warning" control is a contradiction.

Focus goes to the **first action button**, not the first focusable — the
decision's default belongs to the consumer, and `initialFocus` lets them
pick it explicitly.

## Properties

| Property       | Attribute       | Description                                                                                                                                                        | Type      | Default |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------- |
| `initialFocus` | `initial-focus` | Selector or element id for the control that receives initial focus — the action the consumer wants to be the default. Falls back to the first button in the panel. | `string`  | `""`    |
| `label`        | `label`         | Accessible name. Required in spirit: an interruption that announces nothing is a modal mystery. Prefer a real heading in the `title` slot.                         | `string`  | `""`    |
| `open`         | `open`          | Whether the alert is showing.                                                                                                                                      | `boolean` | `false` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
