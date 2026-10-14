# sk-switch



<!-- Auto Generated Below -->


## Overview

Switch — Tier 2, the second of the three missing form controls.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

A switch is the checkbox contract under a different role. It renders a real
native `<input type="checkbox">` carrying `role="switch"`, which is what the
ARIA authoring practices direct: the platform still owns FACE, the
Space-to-toggle behavior, constraint validation through `required`, and
autofill, while assistive technology reads the state as on/off instead of
checked/unchecked. Nothing about the form behavior is reimplemented.

The distinction from Checkbox is *when* it applies, not what it submits:
a switch is an on/off setting that acts immediately, a checkbox is an
option collected for a later submit. The registry `ai` block carries that
guidance; the contract here is identical on purpose.

The visual is the brutalist track-and-thumb, not the native box. The track
is a 3px-stroked rectangle (no rounding — chrome is square) with a thumb
that slides on the arcade easing; `:checked` moves the thumb and fills the
track. Like Checkbox's tick, the state change is drawn in CSS, not shipped
as an asset.

`sk-value-change` fires only for user-initiated changes (section 4): the
native `change` event is the only event path, and a programmatic prop write
dispatches none.

## Properties

| Property         | Attribute         | Description                                                                                                                                    | Type                   | Default     |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `checked`        | `checked`         | Whether the switch is on. An ARIA-mirroring boolean, so the ARIA name verbatim (ADR-013, decision 1) — not `isOn`.                             | `boolean`              | `false`     |
| `defaultChecked` | `default-checked` | Initial state for the uncontrolled case.                                                                                                       | `boolean`              | `false`     |
| `description`    | `description`     | Persistent helper text below the row.                                                                                                          | `string`               | `""`        |
| `disabled`       | `disabled`        | Disables interaction. Mirrors the ARIA name.                                                                                                   | `boolean`              | `false`     |
| `error`          | `error`           | The validation message. Its presence drives `aria-invalid`.                                                                                    | `string`               | `""`        |
| `form`           | `form`            | Associates the control with a form it is not nested inside.                                                                                    | `string \| undefined`  | `undefined` |
| `invalid`        | `invalid`         | Marks the field invalid, with the same independence from `error` as Checkbox.                                                                  | `boolean`              | `false`     |
| `label`          | `label`           | The label text, rendered beside the track. Wraps the control.                                                                                  | `string`               | `""`        |
| `required`       | `required`        | Native constraint validation still applies and is never suppressed.                                                                            | `boolean`              | `false`     |
| `size`           | `size`            | Label text size. The row target stays 44px at every size.                                                                                      | `"lg" \| "md" \| "sm"` | `"md"`      |
| `value`          | `value`           | The submitted value when on. `"on"` is the platform default, kept so a plain form reads exactly what a native checkbox-role=switch would send. | `string`               | `"on"`      |
| `variant`        | `variant`         | Visual emphasis.                                                                                                                               | `"default" \| "quiet"` | `"default"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
