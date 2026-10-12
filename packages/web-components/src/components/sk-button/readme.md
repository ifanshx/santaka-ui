# sk-button



<!-- Auto Generated Below -->


## Overview

Button — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

Conventions enforced here, per section 4:
  - `variant` and `size` are the only visual configuration props.
  - `disabled` and `loading` are ARIA names, not `isDisabled`.
  - State is exposed as `data-*` attributes for CSS and tests.
  - Styling hooks are `data-slot`, not utility classes.

Keyboard, activation-blocking, and form participation live in
`shared/button-base.ts`, shared with `sk-icon-button`.

## Properties

| Property   | Attribute  | Description                                                                                                                                    | Type                                                           | Default     |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `disabled` | `disabled` | Disables interaction. Mirrors the ARIA name.                                                                                                   | `boolean`                                                      | `false`     |
| `loading`  | `loading`  | Shows a busy state and blocks interaction.                                                                                                     | `boolean`                                                      | `false`     |
| `size`     | `size`     | Control height.                                                                                                                                | `"lg" \| "md" \| "sm"`                                         | `"md"`      |
| `type`     | `type`     | `submit`, `reset`, or `button`. Native semantics, so a Button inside a form behaves like the `<button>` a consumer would have written by hand. | `"button" \| "reset" \| "submit"`                              | `"button"`  |
| `variant`  | `variant`  | Visual emphasis.                                                                                                                               | `"danger" \| "ghost" \| "outline" \| "primary" \| "secondary"` | `"primary"` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
