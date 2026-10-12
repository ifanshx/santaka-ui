# sk-link



<!-- Auto Generated Below -->


## Overview

Link — Tier 1 foundation component.

Behavior owner: `web-components` (section 4, Implementation ownership rule).

A link is an anchor. This component exists for two reasons, not for
decoration:

 1. The underline and focus treatment are the part every design system gets
    subtly wrong, and they are stated once here.
 2. It documents the one rule a component cannot enforce: an action is a
    button, a navigation is a link. `sk-button` exists for the former.

Because it is a real `<a>` under the hood, middle-click, "open in new tab",
and copying the URL all work — the things a `div` with a click handler breaks.

## Properties

| Property   | Attribute  | Description                                                                                                                                                                                        | Type                  | Default     |
| ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------- |
| `download` | `download` |                                                                                                                                                                                                    | `string \| undefined` | `undefined` |
| `external` | `external` | `external` marks a link that leaves the application: it adds the external icon, sets `target="_blank"`, and adds `rel="noopener noreferrer"`. Left off by default because most links do not leave. | `boolean`             | `false`     |
| `href`     | `href`     | The destination. A link that navigates.                                                                                                                                                            | `string`              | `""`        |
| `rel`      | `rel`      | Forwarded to the underlying anchor.                                                                                                                                                                | `string \| undefined` | `undefined` |
| `subtle`   | `subtle`   | Suppresses the underline until hover or focus.                                                                                                                                                     | `boolean`             | `false`     |
| `target`   | `target`   | Opens in a new tab without the external treatment.                                                                                                                                                 | `string \| undefined` | `undefined` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
