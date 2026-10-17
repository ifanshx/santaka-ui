---
"@santaka-ui/react": minor
"@santaka-ui/vue": minor
"@santaka-ui/svelte": minor
---

Correct the element type declarations, and add the test that keeps them true.

The declarations are hand-written copies of the custom elements, and they had
drifted from the `@Prop` decorators they copy. A drifted copy is worse than a
missing one: it compiles while being wrong.

**Members that the elements have, and the copies did not.** Reading them off the
element was a type error even though the property exists: React's `CheckboxElement`
was missing `value` and `defaultChecked`, `RadioGroupElement` and `SelectElement`
were missing `defaultValue`, `SwitchElement` was missing `value`,
`InputElement` was missing `autocomplete`, `placeholder` and `form`,
`TextareaElement` was missing `form` and `placeholder`, `SeparatorElement` was
missing `label`.

**Members the elements do not have.** React's `CustomEvent` elements dispatch
`sk-value-change` events, and `CheckboxElement`, `RadioGroupElement` and
`SwitchElement` declared an `onValueChange` callback instead — so
`element.onValueChange` was `undefined` at runtime while TypeScript said it was a
function. The handler props that do exist (`onSkValueChange`) are unchanged.

`name` is in the same category for a different reason. A form-associated element is
named by its host **attribute**, so the adapters write `name` as an attribute
rather than as a property (`"name" in element` is false, and that is what the form
association needs); instead of a comment saying so, `name` was declared as a
property in the Vue element types. It is now declared only where it is true: on the
adapter props, and as a JSX attribute in React.

**Unions widened to `string`.** `variant`, `size`, `type` and their neighbours are
unions of string literals in the components, and `string` accepts any value —
including misspellings the element ignores. Twenty-one declarations were widened
this way in Svelte, nine element types and twelve attribute maps:
`SkBadgeElement.variant`/`size`, `SkButtonElement.variant`/`size`/`type`,
`SkInputElement.type`/`variant`/`size`, `SkTextareaElement.variant`, the matching
`Sk*Attributes` members (including the icon button's, which mirror the button's),
and `SkIconButtonElement` through the button type it composes.

**What to do if you depend on an exported type.** The narrowing above is the one
change that can require your code to change: if you passed a variable typed
`string` where a union is now declared — `variant={someString}` — it will no
longer type check, and it never worked at runtime unless the string happened to be
one of the unions. No version of these packages has been published, so nothing in
the wild is affected.

`tests/declarations/adapter-types.test.mjs` now compares all four copies (React's
`custom-elements.d.ts`, the React, Vue and Svelte adapter types, and the Svelte
attribute maps) against the components' own `@Prop` decorators, for all
twenty-six components, and fails in both directions: a property the element has
cannot be hidden, a member the element does not have cannot be declared, and a
literal union cannot be widened. It runs as its own CI step rather than inside
`pnpm run verify`, because it compares across packages: the copies are never
assignability-checked against the components, which is how all of this went
unnoticed.
