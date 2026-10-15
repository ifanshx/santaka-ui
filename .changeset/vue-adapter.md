---
"@santaka-ui/vue": minor
---

Add `@santaka-ui/vue`, a Vue 3 adapter over the same custom elements as
`@santaka-ui/react`.

The package exports the same component names in the same order as the React
adapter — Button, IconButton, Badge, Card, Link, Input, Select, Textarea, Text,
Checkbox, Switch, RadioGroup, Spinner, Skeleton, Label, Separator, Dialog,
AlertDialog, Toast, Tooltip, Tabs — so a consumer moving between the two
frameworks finds one surface, not two dialects. Per section 4, every component
is owned by `@santaka-ui/web-components`; these adapters carry typing, prop and
attribute mapping, event ergonomics, and form wiring only.

Where the two adapters must differ, the difference is the framework's, and it is
recorded in the code rather than hidden:

- **Event subscription.** Vue's `isOn` check accepts `onSkOpenChange` and
  hyphenates the remainder, so that is a real listener on `sk-open-change`.
  React's rule is the opposite — a lowercase `onsk-open-change` there sets a
  property, not a subscription — which is why the React adapter subscribes
  imperatively with `addEventListener`.
- **The class merge.** Vue's attribute fallthrough merges a consumer's `class`
  onto the root element because the component declares no `class` prop.
  Declaring one would disable the merge, so the adapters do not.

Two defects were found and fixed while writing the tests:

- **A phantom slot.** Six field adapters (`input`, `textarea`, `select`,
  `switch`, `checkbox`, `radio-group`) declared a `default` slot the element does
  not have. React's adapters take no `children` and the elements render no
  `<slot>`, so a consumer who passed default content had it silently dropped.
  Two of the six declared the slot without ever rendering it; two rendered it
  into an element with nothing to receive it. The declarations and the renders
  are gone, and a per-adapter test asserts the absence so a regression names the
  component that caused it.
- **A prop written to the wrong channel.** `select`'s `defaultValue` was asserted
  against the `default-value` attribute; the element declares `defaultValue` as a
  prop, so Vue writes the property. The test now reads the property, which is the
  contract, rather than the attribute, which was the accident.

The adapters are proven by 95 unit tests across prop mapping, the class merge,
the exposed ref, form `name` wiring, and the no-slot boundary. Behavior itself —
variants, ARIA, focus, form submission — stays owned and proven in
`@santaka-ui/web-components`.

`tests/consumer/run.mjs` now packs nine packages rather than eight, installs the
Vue tarball into a scratch project outside the workspace, and adds two checks:
the shipped declarations type-check from the tarball under NodeNext, and the
adapter renders through `vue/server-renderer`. The SSR check is the one that
matters for ADR-005's R2 risk — a component that touches `document` during
`setup` throws in a server pass, and the check is negative-tested by doing
exactly that.
