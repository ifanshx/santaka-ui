# sk-alert



<!-- Auto Generated Below -->


## Overview

Alert — an inline, static status message.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

An alert is chrome, not a floating layer: it renders in the document flow,
pushes content down when it appears, and never overlays anything. It is not
a toast (sk-toast exists and is floating) and it is not a dialog; a message
that needs to interrupt over everything on screen belongs to those
components, not to this one.

It owns no state and deliberately has no dismiss button: a dismissible
message needs a close affordance, a focus move into that affordance, and a
focus return when it goes away — which is a different component with its own
contract. This component only ever states; it never hides itself.

## Properties

| Property  | Attribute | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Type                                                           | Default     |
| --------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `heading` | `heading` | Heading text for the alert, rendered as a `<span>`.  Named `heading`, not `title`, for the reason sk-card records: `title` is a standardized `HTMLElement` member and a prop by that name is shadowed by the prototype property, so the browser would surface it as a hover tooltip on the whole alert.  A string rather than a heading element: the alert does not know what level it sits at in the document's outline, and a hard-coded heading inside it produces a level that may contradict the surrounding structure. A consumer who needs a real heading puts one in the body itself. | `string`                                                       | `""`        |
| `variant` | `variant` | Visual emphasis.  Only `variant` is an appearance prop. The variant also picks the component's default live-region role, unless the consumer has already set one.                                                                                                                                                                                                                                                                                                                                                                                                                             | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` |


## Slots

| Slot        | Description      |
| ----------- | ---------------- |
|             | The default slot |
| `"actions"` |                  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
