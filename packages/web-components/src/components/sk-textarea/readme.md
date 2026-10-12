# sk-textarea



<!-- Auto Generated Below -->


## Overview

Textarea — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

A textarea is an input with a different rendered element, and that is exactly
what it is here: the form contract, validation reporting, label wiring, and
change-event rule all live in `shared/form-control-base.ts`, shared with
`sk-input`. A second copy would be a second thing to fix the moment
accessibility behavior changed.

The differences are the ones the element demands, not decoration:

 - `rows` and `cols` are what size a textarea. There is no `size` in the
   Button sense, so this component takes `rows` and leaves the visual axis to
   the one the browser already understands.
 - `<textarea>` takes its initial content as *children*, not a `value`
   attribute, so the fallback path for plain HTML is the text content.
 - `pattern` does not apply to a textarea at all. Long-form text has no
   single-line grammar, so the prop is absent rather than accepted and
   ignored.

## Properties

| Property       | Attribute       | Description                                                                                                                                                                                                                                                      | Type                   | Default     |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `cols`         | `cols`          | Visible columns, for the few cases where it matters.                                                                                                                                                                                                             | `number \| undefined`  | `undefined` |
| `defaultValue` | `default-value` | Initial value for the uncontrolled case.                                                                                                                                                                                                                         | `string`               | `""`        |
| `description`  | `description`   | Persistent helper text below the field.                                                                                                                                                                                                                          | `string`               | `""`        |
| `disabled`     | `disabled`      | Disables interaction. Mirrors the ARIA name.                                                                                                                                                                                                                     | `boolean`              | `false`     |
| `error`        | `error`         | The validation message. Its presence drives `aria-invalid`.                                                                                                                                                                                                      | `string`               | `""`        |
| `form`         | `form`          | Associates the control with a form it is not nested inside.                                                                                                                                                                                                      | `string \| undefined`  | `undefined` |
| `invalid`      | `invalid`       | Marks the field invalid independently of any error text.                                                                                                                                                                                                         | `boolean`              | `false`     |
| `label`        | `label`         | The control's own label text, rendered above the field.                                                                                                                                                                                                          | `string`               | `""`        |
| `maxLength`    | `maxlength`     | Maximum accepted length, enforced natively. Same attribute-name reason.                                                                                                                                                                                          | `number \| undefined`  | `undefined` |
| `minLength`    | `minlength`     | Minimum accepted length, enforced natively.  Attribute-observed because Stencil's camelCase-to-kebab mapping produces `min-length`, not the native `minlength`, so `<sk-textarea minlength="2">` was silently ignored — the same class of defect `readonly` had. | `number \| undefined`  | `undefined` |
| `placeholder`  | `placeholder`   | Placeholder text. Never a substitute for a label.                                                                                                                                                                                                                | `string`               | `""`        |
| `readOnly`     | `readonly`      | Makes the field non-editable but still submitted and focusable.  Attribute-observed, for the same reason as `sk-input`: Stencil's camelCase-to-kebab mapping produces `read-only`, not the native `readonly`.                                                    | `boolean`              | `false`     |
| `required`     | `required`      | Native constraint validation still applies and is never suppressed.                                                                                                                                                                                              | `boolean`              | `false`     |
| `rows`         | `rows`          | Visible rows. The browser's own sizing, not a pixel value.                                                                                                                                                                                                       | `number`               | `4`         |
| `value`        | `value`         | The value. Uncontrolled by default: typed value only if set.                                                                                                                                                                                                     | `string`               | `""`        |
| `variant`      | `variant`       | Visual emphasis.                                                                                                                                                                                                                                                 | `"default" \| "quiet"` | `"default"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
