# sk-field



<!-- Auto Generated Below -->


## Overview

Field — Tier 1 form component: the wrapper that labels, describes, and marks a
control it does not own.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

`sk-input`, `sk-textarea`, and `sk-select` each render their own label,
description, and error. That is right for a self-contained control and wrong
the moment the control is *not one of ours* — a consumer's `<input>`, a
third-party widget, or several controls under one label. This component exists
for exactly that case, and the boundary is the point:

**It describes; it does not control.** The field owns the label, the
description, the error, and the ARIA wiring that points at them. It never
reads or writes the control's value, never sets `name`, and never calls
`setFormValue` — the control is not form-associated through this wrapper. A
wrapper that also tried to own the value would be a second owner of it, and
the two would eventually disagree, which is the failure §4's "exactly one
implementation owns the behavior" rule exists to prevent.

### The only attributes it sets on the control

ARIA association is not optional and not the consumer's job to guess:
`aria-labelledby`, `aria-describedby`, `aria-invalid`, and `aria-required`
have to sit on the *control*, because that is the element a screen reader is
on when it announces them. So the field finds the first control in its slot
and sets those four, and nothing else. They are description;
`value`, `name`, `disabled`, and validity stay the control's own business.

The label is associated by id rather than by wrapping: the control is the
consumer's, and a `<label>` wrapping an element this component did not render
would make the association indirect and fragile under re-renders.

§4 requires the error id to be **appended** to any existing description rather
than replacing it — an error that silences the hint removes the format
instruction exactly when the user needs it.

## Properties

| Property      | Attribute     | Description                                                                 | Type      | Default |
| ------------- | ------------- | --------------------------------------------------------------------------- | --------- | ------- |
| `description` | `description` | Persistent helper text, announced through `aria-describedby`.               | `string`  | `""`    |
| `disabled`    | `disabled`    | Announces the field as disabled. Does not disable the control itself.       | `boolean` | `false` |
| `error`       | `error`       | The validation message. Its presence drives `aria-invalid`.                 | `string`  | `""`    |
| `invalid`     | `invalid`     | Marks the field invalid independently of whether `error` is set.            | `boolean` | `false` |
| `label`       | `label`       | Label text. Becomes the accessible name of the control inside.              | `string`  | `""`    |
| `required`    | `required`    | Marks the field required. Announced through `aria-required` on the control. | `boolean` | `false` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
