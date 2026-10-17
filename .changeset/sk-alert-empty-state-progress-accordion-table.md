---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/vue": minor
"@santaka-ui/web-components": minor
---

Six components, and the surfaces and the compound pair they needed.

`sk-alert` renders a status surface whose role follows the variant — `status` for
the informational ones, `alert` for the interrupting one — because choosing a
variant is choosing an announcement policy. `sk-empty-state` is the placeholder
that sits in an empty region: heading, description, icon slot, actions slot, and
a `bare` variant for the copy inside a card. `sk-progress` is one component for
both states; **an absent `value` is the indeterminate signal**, so `aria-valuenow`
is omitted with it rather than sent as `0`, and there is no `indeterminate` prop
to disagree with the value. `sk-accordion` with `sk-accordion-item` is a
disclosure group over native `<details>`/`<summary>`, so the platform keeps the
semantics, the focus stop, and Enter/Space activation; `multiple` on the group
governs sibling exclusion, `open` on the item reflects both ways, and a toggle
emits a bubbling `sk-open-change` with `detail.open`. `sk-table` is a skin a
consumer authors a real `<table>` inside — the table semantics, the caption, and
the column headers survive untouched — with the scroll region as the keyboard stop.

Both framework adapters cover the six, the registry carries derived `props` and
`events` for each, and the Storybook workshop has stories with interaction tests
for the accordion, the progress bar, the empty state, and the table.

One defect worth naming because it took a measurement to see: the accordion's
`toggle` listener was on the host, and `toggle` does not bubble — every click
toggled the native `<details>` while the reflected `open` stayed at whatever the
markup said. It now lives on the element the event is dispatched from.
