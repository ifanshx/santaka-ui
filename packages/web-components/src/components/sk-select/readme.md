# sk-select



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                                                                | Type                   | Default     |
| -------------- | --------------- | -------------------------------------------------------------------------- | ---------------------- | ----------- |
| `defaultValue` | `default-value` | Initial value for the uncontrolled case.                                   | `string`               | `""`        |
| `description`  | `description`   | Persistent helper text below the field.                                    | `string`               | `""`        |
| `disabled`     | `disabled`      | Disables interaction. Mirrors the ARIA name.                               | `boolean`              | `false`     |
| `error`        | `error`         | The validation message. Its presence drives `aria-invalid`.                | `string`               | `""`        |
| `form`         | `form`          | Associates the control with a form it is not nested inside.                | `string \| undefined`  | `undefined` |
| `invalid`      | `invalid`       | Marks the field invalid, with the same independence from `error` as Input. | `boolean`              | `false`     |
| `label`        | `label`         | The control's own label text, rendered above the field.                    | `string`               | `""`        |
| `options`      | --              | The choices. Serialized as JSON when written as an attribute.              | `SelectOption[]`       | `[]`        |
| `placeholder`  | `placeholder`   | Placeholder-style first choice, shown when the value is "".                | `string`               | `""`        |
| `required`     | `required`      | Native constraint validation still applies and is never suppressed.        | `boolean`              | `false`     |
| `size`         | `size`          | Control height.                                                            | `"lg" \| "md" \| "sm"` | `"md"`      |
| `value`        | `value`         | The value. Uncontrolled by default.                                        | `string`               | `""`        |
| `variant`      | `variant`       | Visual emphasis.                                                           | `"default" \| "quiet"` | `"default"` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
