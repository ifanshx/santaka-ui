---
"@santaka-ui/vue": minor
---

Adds the seven Vue wrappers that were missing, and a test that keeps them from
going missing again.

Breadcrumb, Combobox, Drawer, Pagination, Popover, Slider, and Taka each shipped
with a universal element, a React wrapper, a registry entry, browser tests, and a
Storybook story — but no `@santaka-ui/vue` adapter. Nothing failed, and
`docs/framework-support.md` lists Vue as Stable, so a consumer reading the support
matrix had no way to learn that a third of the newest components were absent from
the adapter they were told to use.

The seven wrappers follow the package's existing rules: props are assigned as
element properties through `elementProps`, an omitted prop is dropped rather than
coerced to `""`, the exposed ref resolves to the custom element through
`elementProxy`, and each component's behavior stays owned by
`@santaka-ui/web-components`.

The part that matters more than the seven files is `wrapper-parity.test.ts`: it
derives the component list from the universal package's directories and fails when
a component has no Vue wrapper, or when the two adapters' exported surfaces differ.
Both directions were proven to bite by removing two wrappers — three tests failed,
naming the components.
