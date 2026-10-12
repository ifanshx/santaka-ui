# sk-badge



<!-- Auto Generated Below -->


## Overview

Badge — Tier 1 display component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A badge is a static label, not an interactive element. That is stated here
because "badge" invites the wrong implementation: a clickable badge is a
button with extra steps, and a badge inside a link is the link's job.

The one behavior worth encoding is the dot. A status dot conveys meaning by
color alone, which WCAG 1.4.1 forbids, so `variant="dot"` renders a shape that
also carries a text label the consumer supplies. `statusLabel` is required
for that variant in the React types.

## Properties

| Property      | Attribute      | Description                                                                                                                               | Type                                                           | Default     |
| ------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `dot`         | `dot`          | Renders the badge as a dot instead of a pill. Requires a text label for screen readers, because the dot itself conveys nothing but color. | `boolean`                                                      | `false`     |
| `size`        | `size`         | Control height.                                                                                                                           | `"md" \| "sm"`                                                 | `"md"`      |
| `statusLabel` | `status-label` | Screen-reader text for the dot variant. Required when `dot` is set.                                                                       | `string`                                                       | `""`        |
| `variant`     | `variant`      | Visual emphasis.                                                                                                                          | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
