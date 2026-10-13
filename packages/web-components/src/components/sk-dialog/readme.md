# sk-dialog



<!-- Auto Generated Below -->


## Overview

Dialog — Tier 2 floating overlay, and the first consumer of the glass
material.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

It renders the native `<dialog>` element, which is in the Baseline tier
(Chrome 111 / Safari 16.4) and is therefore a dependency, not an enhancement:
the browser owns focus trapping, Escape, `::backdrop`, and inert background
content, and reimplementing any of those is how dialogs lose focus in exactly
the case nobody tested. Core-tier browsers are not asked to fake it — they
get the non-modal degradation below.

State ownership follows §4 "Controlled and uncontrolled": open/closed is
ephemeral state the component owns outright, so there is no `defaultOpen`.
The caller observes `sk-open-change` and may set `open` back; the component
never corrects the caller.

## Properties

| Property      | Attribute     | Description                                                                                                                                                                                                                                                       | Type      | Default |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `dismissible` | `dismissible` | Closes when the backdrop is clicked. Off by default because a dialog holding form input loses work to a stray click; a confirmation prompt with nothing to lose wants it on.                                                                                      | `boolean` | `false` |
| `label`       | `label`       | The dialog's accessible name, applied to the panel when the consumer has not slotted a `<sk-text>` heading. Prefer the slot: a real heading is visible to everyone and doubles as the label.                                                                      | `string`  | `""`    |
| `modal`       | `modal`       | Modal is the default and the usual case: the page behind is inert and the focus is trapped. Non-modal (Chrome/Edge/Firefox only — Safari has no `showModal`-independent backdrop) renders the panel inline without blocking the page, for tool-palette-style UIs. | `boolean` | `true`  |
| `open`        | `open`        | Whether the dialog is showing. Reflects so page CSS can target it.                                                                                                                                                                                                | `boolean` | `false` |


## Methods

### `close() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `showModal() => Promise<void>`

Imperative open/close for non-template consumers. The props stay the
declarative path; these exist because some callers (a toast-style flow)
want to open without re-rendering.

#### Returns

Type: `Promise<void>`




## Slots

| Slot        | Description |
| ----------- | ----------- |
| `"trigger"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
