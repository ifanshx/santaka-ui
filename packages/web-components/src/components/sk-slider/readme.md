# sk-slider



<!-- Auto Generated Below -->


## Overview

Slider — Tier 2 form control: a single value on a range.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

### The one decision that shapes everything else

**A real `<input type="range">` does the work.** The native input owns the
pointer drag, the keyboard model, the ARIA slider role, `aria-valuenow`,
`aria-valuetext`, and the touch behaviour. Reimplementing those is where a
slider usually goes wrong — a `<div>` with `role="slider"` and hand-written
arrow handling loses the platform's own step rounding, and it silently breaks
on touch and on screen readers that read the native control better.

That is also what makes this form-associated for free: the native input
submits through a plain `<form>`, and `ElementInternals` is used only to
report validity, never to duplicate the value. One owner of the value, as §4
requires.

### What is actually ours

- **The visual treatment**: hard-edged chrome, a 3px stroke track, and a
  square thumb — the brutalist reading of a slider, where most libraries ship
  a pill on a pill.
- **The tick marks and the output**, which the native control does not draw.
- **RTL**: the native input already mirrors under `dir="rtl"`; the *fill* has
  to follow, and it does so through logical properties rather than a
  direction flag. §4's rule is that horizontal keyboard semantics derive from
  `getComputedStyle().direction` at interaction time — the native input does
  exactly that, which is the main reason not to reimplement it.
- **Reduced motion**: the thumb does not animate on keyboard steps.

`aria-valuetext` is set when the consumer supplies a `format` string, so a
screen reader announces "3 of 10" rather than a bare number. §6 says locale is
consumer-supplied, so the component formats only what it is told.

## Properties

| Property      | Attribute     | Description                                                                                                                                                                                                      | Type      | Default |
| ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `description` | `description` | Persistent helper text.                                                                                                                                                                                          | `string`  | `""`    |
| `disabled`    | `disabled`    | Disables the control and withholds it from submission.                                                                                                                                                           | `boolean` | `false` |
| `error`       | `error`       | The validation message. Its presence drives `aria-invalid`.                                                                                                                                                      | `string`  | `""`    |
| `format`      | `format`      | A template for `aria-valuetext`, where `$v` is the value and `$m` is the maximum — "$v of $m". What a screen reader announces instead of a bare number.                                                          | `string`  | `""`    |
| `invalid`     | `invalid`     | Marks the field invalid independently of whether `error` is set.                                                                                                                                                 | `boolean` | `false` |
| `label`       | `label`       | The accessible name, and the label rendered above the control.                                                                                                                                                   | `string`  | `""`    |
| `max`         | `max`         | Largest value.                                                                                                                                                                                                   | `number`  | `100`   |
| `min`         | `min`         | Smallest value.                                                                                                                                                                                                  | `number`  | `0`     |
| `name`        | `name`        | Native form semantics. The control is named by the host attribute.                                                                                                                                               | `string`  | `""`    |
| `showValue`   | `show-value`  | Renders the numeric output beside the label.  Off by default: a value the consumer is already displaying in their own UI should not be duplicated here, and a bare number with no unit is often worse than none. | `boolean` | `false` |
| `step`        | `step`        | Granularity. `0` means any value the browser can represent.                                                                                                                                                      | `number`  | `1`     |
| `value`       | `value`       | The current value.                                                                                                                                                                                               | `number`  | `50`    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
