# sk-checkbox



<!-- Auto Generated Below -->


## Overview

Checkbox — Tier 2, the first of the three missing forms controls.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

This is the Input contract on a boolean: FACE with all three callbacks,
native constraint validation through `required`, label/description/error
wiring, and `sk-value-change` only for user-initiated changes.

The shared text base (`setupFormControl`/`syncFormControl`) is deliberately
NOT reused wholesale. It speaks strings: it reads `event.target.value` and
writes `setFormValue(value)` verbatim. A checkbox speaks a boolean — the
native `change` event carries the same `value` attribute whether the box was
just checked or unchecked, and `setFormValue("")` would submit an empty pair
where the platform withholds the entry entirely. Translating at the accessor
boundary was the first attempt, and it got unchecking wrong: every toggle
read back as checked. So this component owns the boolean path and reuses
only the stateless pieces — `createFieldWiring` and `isFieldInvalid` — plus
the validity half of `syncFormControl` through a string view the base never
submits.

The rendered control is a real native `<input type="checkbox">`, visually
restyled but never removed. `appearance: none` clears the native box so the
brutalist one draws instead, while the input stays in the tab order, keeps
the platform's Space-to-toggle behavior, and remains the labelled element
the form and assistive technology see.

The label wraps the input rather than pointing at it with `for`. For a
checkbox the lead sentence is the control itself — Label's `marker="before"`
exists for exactly this shape — and a wrapping label makes the whole row
the activation target with no click handler, because the browser's own label
activation toggles it.

`indeterminate` is visual state, not form state: the property-only flag the
platform exposes for "some but not all children", written to the DOM node
after each render because it is not an attribute and cannot be declared in
JSX. An indeterminate checkbox submits as unchecked (`null`), which is what
the platform does — a half-answer is not an answer.

## Properties

| Property         | Attribute         | Description                                                                                                                                                                                                                | Type                   | Default     |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `checked`        | `checked`         | Whether the box is checked. An ARIA-mirroring boolean, so the ARIA name verbatim (ADR-013, decision 1) — not `isChecked`, not `value`.                                                                                     | `boolean`              | `false`     |
| `defaultChecked` | `default-checked` | Initial state for the uncontrolled case.                                                                                                                                                                                   | `boolean`              | `false`     |
| `description`    | `description`     | Persistent helper text below the row.                                                                                                                                                                                      | `string`               | `""`        |
| `disabled`       | `disabled`        | Disables interaction. Mirrors the ARIA name.                                                                                                                                                                               | `boolean`              | `false`     |
| `error`          | `error`           | The validation message. Its presence drives `aria-invalid`.                                                                                                                                                                | `string`               | `""`        |
| `form`           | `form`            | Associates the control with a form it is not nested inside.                                                                                                                                                                | `string \| undefined`  | `undefined` |
| `indeterminate`  | `indeterminate`   | Visual "some children" state. Property-only on the platform — there is no `indeterminate` attribute — so this prop writes the DOM node after render and never reaches the form: an indeterminate box submits as unchecked. | `boolean`              | `false`     |
| `invalid`        | `invalid`         | Marks the field invalid, with the same independence from `error` as Input.                                                                                                                                                 | `boolean`              | `false`     |
| `label`          | `label`           | The label text, rendered beside the box. Wraps the control.                                                                                                                                                                | `string`               | `""`        |
| `required`       | `required`        | Native constraint validation still applies and is never suppressed.                                                                                                                                                        | `boolean`              | `false`     |
| `size`           | `size`            | Label text size. The row target stays 44px at every size.                                                                                                                                                                  | `"lg" \| "md" \| "sm"` | `"md"`      |
| `value`          | `value`           | The submitted value when checked. `"on"` is the platform default, kept so a plain form reads exactly what a native checkbox would send.                                                                                    | `string`               | `"on"`      |
| `variant`        | `variant`         | Visual emphasis.                                                                                                                                                                                                           | `"default" \| "quiet"` | `"default"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
