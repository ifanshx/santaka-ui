---
"@santaka-ui/web-components": minor
"@santaka-ui/react": minor
"@santaka-ui/vue": minor
"@santaka-ui/svelte": minor
"@santaka-ui/core": minor
---

Adds `sk-field`, the last of the five Tier 1 components section 7 names that had
not shipped. Tier 1 is now complete.

A field labels, describes, and marks a control it does **not** own — a plain
`<input>`, a third-party widget, or several controls under one label. `sk-input`,
`sk-textarea`, and `sk-select` render their own label, description, and error,
which is right for a self-contained control and wrong the moment the control is
not one of ours.

It describes; it does not control. It sets exactly four attributes on the slotted
control — `aria-labelledby`, `aria-describedby`, `aria-invalid`, and
`aria-required` — and nothing else. `value`, `name`, `disabled`, and validity
stay the control's own business, and the field is not form-associated: it never
sets `name` and never calls `setFormValue`. A wrapper that owned the value too
would be a second owner of it, which is what §4's ownership rule prevents.

The attributes go **on the control**, not the host, because that is the element a
screen reader is on when it announces them. The label is associated by id rather
than by wrapping, since the control is the consumer's and a `<label>` around an
element this component did not render makes the association indirect.

The description and error ids are appended together rather than one replacing the
other: an error that silences the hint removes the format instruction exactly
when the user needs it. `invalid` and `error` are separate props, so a field can
be invalid before the consumer knows why. `required` renders an `aria-hidden`
asterisk plus a visually hidden word, so a reader hears "required" rather than a
symbol. The error carries a glyph as well as colour (WCAG 1.4.1).

Coverage: 9 browser tests in `e2e/field.e2e.ts`, negative-tested by making the
error replace the description instead of joining it — one test fails, which is
the evidence the append rule is asserted rather than assumed. A Storybook story,
and declarations in the React, Vue, and Svelte packages.
