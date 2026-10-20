# sk-combobox



<!-- Auto Generated Below -->


## Overview

Combobox — Tier 2 form control: a text field with a filterable list.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

### The ARIA pattern, and the part everyone gets wrong

The ARIA 1.2 combobox pattern is four separate pieces, and a component that
merges them is a component a screen reader cannot drive:

1. The **input** carries `role="combobox"`, `aria-expanded`, and
   `aria-controls` pointing at the listbox.
2. The **listbox** carries `role="listbox"` and is the element `aria-controls`
   names.
3. **Focus never leaves the input.** The active option is reported through
   `aria-activedescendant` on the input, not by moving focus into the list.
   Moving focus is the common mistake: it fires a blur on the field the reader
   is typing into, and every screen reader announces it as leaving.
4. The **options** carry `role="option"` and `aria-selected`, with ids
   `aria-activedescendant` can name.

### Decisions specific to this component

- **A real `<input>` inside the host**, and the list is a real `<ul>`. The
  component filters; it does not reimplement text editing. Native validation,
  IME, and autofill all keep working because the input is the input.
- **§4's event rule**: `sk-value-change` fires only for user-initiated changes.
  Filtering as the reader types is not a value change — only a committed
  selection is.
- **Escape closes without clearing.** Closing and reverting are different
  commands; the reader's typed text is their work.
- **No `aria-live` announcement of the result count.** It looks helpful and is
  a known anti-pattern: it interrupts on every keystroke. The listbox
  relationship already tells a screen reader the results changed.

§6: the component does no locale-sensitive work. Matching is a plain
case-insensitive substring, which is the wrong collation for some locales and
is deliberately left to the consumer, who may pass pre-filtered options.

## Properties

| Property      | Attribute     | Description                                                      | Type                                            | Default |
| ------------- | ------------- | ---------------------------------------------------------------- | ----------------------------------------------- | ------- |
| `description` | `description` | Persistent helper text.                                          | `string`                                        | `""`    |
| `disabled`    | `disabled`    | Disables the control.                                            | `boolean`                                       | `false` |
| `error`       | `error`       | The validation message. Its presence drives `aria-invalid`.      | `string`                                        | `""`    |
| `invalid`     | `invalid`     | Marks the field invalid independently of whether `error` is set. | `boolean`                                       | `false` |
| `label`       | `label`       | The accessible name, and the label rendered above the field.     | `string`                                        | `""`    |
| `name`        | `name`        | Native form semantics.                                           | `string`                                        | `""`    |
| `options`     | `options`     | The options, as JSON: `[{ "value": "…", "label": "…" }]`.        | `string \| { value: string; label: string; }[]` | `"[]"`  |
| `placeholder` | `placeholder` | Placeholder. Never a substitute for a label.                     | `string`                                        | `""`    |
| `value`       | `value`       | The selected value.                                              | `string`                                        | `""`    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
