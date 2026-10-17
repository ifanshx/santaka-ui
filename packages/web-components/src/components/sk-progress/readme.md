# sk-progress



<!-- Auto Generated Below -->


## Overview

Progress — Tier 1 feedback component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).
The React package adapts this specification; it does not reimplement it.

A progress bar is a non-interactive status display. It takes no focus, has no
press state, and declares nothing beyond `role="progressbar"` — a progress
bar that eats Tab stops is a control pretending to be a status, and the
existing components never confuse the two.

Limitation, recorded deliberately: the component does not render percentage
text. Formatting a percentage is a locale question (3,4 % vs 3.4 %, Arabic
numerals, RTL considerations), and this component does not own locale policy.
A consumer who wants visible text pairs the bar with their own localized
label — that is why `label` exists as the accessible name and nothing
overrides it.

## Properties

| Property | Attribute | Description                                                                                                                                                                                                                                                | Type                   | Default     |
| -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `label`  | `label`   | The accessible name. Rendered as `aria-label` only when non-empty AND only when the host does not already carry `aria-label` or `aria-labelledby`, because a consumer's own labelling must never be clobbered by a default.                                | `string`               | `""`        |
| `max`    | `max`     | The scale the value is measured against. Clamped to 0..max on render.                                                                                                                                                                                      | `number`               | `100`       |
| `size`   | `size`    | Track height scale.                                                                                                                                                                                                                                        | `"lg" \| "md" \| "sm"` | `"md"`      |
| `value`  | `value`   | The current value. A finite number makes the bar determinate; an absent (or non-finite) value makes it indeterminate — there is no honest percentage to report for a task whose length is unknown, so the contract says the bar sweeps instead of filling. | `number \| undefined`  | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
