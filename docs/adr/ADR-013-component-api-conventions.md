# ADR-013: Component API conventions and naming grammar

- **Status:** Accepted (partially; one question recorded as open below)
- **Date:** 2026-10-12
- **Enforced by:** `packages/web-components/e2e/conventions.e2e.ts`

## Context

`docs/ARCHITECTURE.md` §4 states the API conventions are "normative" and that a component
which deviates "does not ship as Stable; the deviation is a design decision that
needs ADR-013". §16 requires that they be "enforced by a conformance test, and
no Stable component deviates".

No such test existed. Writing it surfaced an ambiguity in the conventions
themselves that four shipped components already sit on.

## The open question: which boolean props need the is/has/can prefix

§4 says:

> Boolean props that mirror an ARIA state use the ARIA name verbatim: `open`,
> `checked`, `selected`, `expanded`, `required`, `disabled`, `invalid`,
> `loading`. […] All other boolean props take an `is`, `has`, or `can` prefix:
> `isExternal`, `hasIcon`, `canSubmit`.

Read strictly, "all other boolean props" includes booleans that toggle a
*visual treatment* rather than a state. Four shipped props are in that class:

| Component | Prop | What it toggles |
|---|---|---|
| `sk-link` | `external` | renders the external-link glyph and sets `target`/`rel` |
| `sk-link` | `subtle` | suppresses the underline until hover |
| `sk-badge` | `dot` | renders a circle instead of a pill |
| `sk-text` | `muted` | sets the secondary text color |
| `sk-separator` | `decorative` | removes a purely visual line from the accessibility tree |
| `sk-dialog` | `modal` | renders blocking via `showModal()` instead of inline |
| `sk-dialog` | `dismissible` | closes when the backdrop is clicked |
| `sk-table` | `striped` | zebra rows: even body rows take the sunken surface |

Under a strict reading these must become `isExternal`, `isSubtle`, `isDot`.

The reading against it is not weak. The convention's own example list contains
`isExternal` — so the rule was *written with this exact prop in mind*. That is
evidence the prefix was considered correct for exactly this case, not an
oversight. On the other hand, `isSubtle` and `isDot` read poorly: a dot is
rendered, not "is"-something, and `canSubmit` in the example list is a *capability*
rather than a treatment, which suggests the author was reaching for capability
flags generally.

**This ADR does not resolve it.** Renaming three props across two components is a
breaking API change, and it is not this ADR's place to make that call silently
in a document titled "component API conventions".

### What is decided here

1. **ARIA-mirroring booleans keep their names.** `disabled`, `loading`,
   `invalid`, `open`, `checked`, `selected`, `expanded`, `required` — the
   conformance test treats this as an exhaustive list. A boolean mirroring an
   ARIA state that is not on this list is a violation.
   *Amended when `sk-checkbox` shipped:* `indeterminate` joins the list. It
   mirrors the `mixed` value of `aria-checked` (the tri-state for "some but
   not all children") and is simultaneously the native `HTMLInputElement`
   property name, so the ARIA reading and the platform reading agree.
2. **`readOnly` joins that list.** §4's list omits it, but `readonly` is both an
   ARIA attribute and a native form-control attribute, and it means something
   `disabled` cannot: a read-only field is still submitted and still focusable. A
   form control with no read-only state could not express a value the user must
   not change but must still send, such as a server-assigned identifier. Naming it
   `isReadOnly` would read as a claim about the value rather than the field's
   editability.
3. **State booleans take is/has/can.** A boolean that toggles component *state* —
   something a screen reader conveys and a consumer wires to — is prefixed.
   `hasIcon`, `canSubmit` fit here.
4. **Presentation booleans are open.** The conformance test classifies every
   boolean and reports the ones fitting neither reading, naming ADR-013 as the
   owner of the decision. `sk-link.external`, `sk-link.subtle`,
   `sk-badge.dot`, `sk-separator.decorative`, `sk-dialog.modal`,
   `sk-dialog.dismissible`, and — added when the table shipped —
   `sk-table.striped` are the live instances.
5. **A boolean copied from the native element keeps the platform's spelling.**
   `sk-accordion.multiple` is `<select multiple>` and `<input multiple>`: the
   platform name for the same concept, on the element that carries it. It is
   neither an ARIA state nor a presentation flag, so neither of the readings
   above assigns it a prefix, and renaming it to `isMultiple` would be a second
   spelling for an attribute the platform already named.
6. **Renaming is the default when the question resolves toward prefixing.** If it
   does, `external` → `isExternal` and friends ship as a minor-with-notice,
   because the prop names are public API in every framework adapter.


### Recommendation, not yet adopted

Prefix them. The strongest argument is internal consistency: a consumer reading
`<sk-badge dot>` next to `<sk-badge variant="danger">` learns that props come in
two flavours, and `isDot` keeps that lesson true. The strongest argument against
is that `dot` is a noun the component actually renders, and `isDot` is a
statement about it — and short noun booleans are a well-established React idiom
that consumers already know.

## Also decided here

- **Visual configuration is exactly `variant` and `size`.** The conformance test
  rejects a third appearance prop (`color`, `tone`, `appearance`, `weight`,
  `intent`). A new axis needs an ADR, not a new prop.
- **Scoped styles, never a shadow root** (ADR-011). Enforced statically against
  every component source and at runtime against every element.
- **Styling hooks are `data-slot`, not classes** (§4). Enforced at runtime on
  every instance, not just the first.
- **State is exposed as `data-*` attributes.** `data-state`, `data-disabled`,
  `data-loading` are public API; a class would couple consumers to the
  stylesheet's internals.
- **A prop may not shadow a standardized `HTMLElement` member.** `title` is the
  example: a `@Prop() title` on a custom element shadows the prototype property,
  so the browser renders the value as a hover tooltip over the whole element.
  `sk-card`'s heading prop is `heading` for this reason — the card is not titled,
  it is headed, and a tooltip reading the heading would duplicate it invisibly.
  Stencil warns on reserved names; the convention here is to rename rather than
  suppress.
- **A surface component may have no boolean props at all.** `sk-card` is one, and
  the conformance test exempts it by name rather than requiring a decorative
  boolean to satisfy its vacuity guard. The exemption is guarded in the other
  direction too: if every component were exempted, the test would check nothing,
  and a test that checks nothing is worse than no test.
- **The `sk-` prefix is fixed on every class.** Stencil's own `hydrated` marker is
  excluded by name: it is framework bookkeeping, not a class the library ships or
  documents. The exclusion is by explicit name so it cannot silently widen.
- **Enforced in the browser, not only in source.** A convention can pass a source
  read and fail at runtime, which is exactly how `hydrated` was found.

## Consequences

- The conformance test fails today on the three presentation booleans. That is
  deliberate: the failure is the visible record of an open question, and it will
  resolve either by renaming the props or by amending this ADR with the ruling.
  A test that passes while the question is open would hide it.
- `sk-checkbox.indeterminate` was ruled ARIA-mirroring (decision 1, amended) and
  `sk-checkbox.defaultChecked` is excluded from the boolean scan as a §4
  uncontrolled initializer — `default<Value>` is read once and never written
  back, so it is not state the component exposes. Both were added with the
  checkbox, not smuggled in: the scan's `default*` skip is commented at the
  exclusion site so it cannot silently widen to a general carve-out.

## What would reverse this

If consumers report `isDot` / `isSubtle` / `isExternal` as unnatural in real
code, presentation booleans are exempted from the prefix rule and this ADR is
amended. The decision is cheap to reverse while the library is pre-1.0 and
expensive afterwards, which is why it is recorded now rather than defaulted.