# ADR-024: Internationalization scope and the locale contract

- **Status:** Accepted
- **Date:** 2026-10-19
- **Plan reference:** `docs/ARCHITECTURE.md` §6 "Internationalization and formatting"

## Context

§6 states internationalization is a **v1.0 requirement, not a later
refinement**, and gives the reason: Date Picker, Date Range Picker, Number
Input, Table sorting, and Pagination all depend on it, and retrofitting locale
support after those components ship causes breaking changes. It then requires:

- Locale, timezone, and week-start are consumer-supplied; the library never
  assumes `en-US`, UTC, or a host timezone.
- Use the platform `Intl` APIs rather than shipping a date or number library.
- Parse and format user-entered numeric and date input per the active locale.
- Publish a documented list of locales covered by automated tests, separated
  from locales covered only by manual review.
- Shipped component strings are English by default and overridable through a
  documented locale API.

The repository ships **none** of the five components that motivate the
requirement, and has **no** locale API. The audit found this to be the largest
gap between what `docs/ARCHITECTURE.md` claims and what exists, and it was previously
invisible because nothing cross-checks §6 — the same way §4's physical-property
ban was prose until ADR-016's conformance test enforced it.

So this ADR has to answer honestly: is this a broken promise, or a requirement
whose precondition has not arrived?

## Decision

**The requirement is deferred, not waived, and the deferral is conditional on
the absent components staying absent.**

Two separate things were being conflated, and separating them is the whole
decision:

1. **The five motivating components do not exist.** Date Picker, Date Range
   Picker, Number Input, Table sorting, and Pagination are Tier 3 (§7). None is
   in the v1.0 component set. §6's own argument is consequentialist —
   *retrofitting after those ship causes breaking changes* — so with none of
   them shipped, the argument does not yet bite. This is the part that can be
   deferred safely.
2. **"Locale is consumer-supplied" is already true, and that part is kept.**
   Every shipped component either has no strings or takes its text from the
   consumer. That is a design property, not an accident, and it is what makes
   the deferral non-breaking: a component with no strings of its own has no
   locale to be wrong about.

### What ships, and what it means

- **No component hardcodes a locale-dependent format.** `sk-progress` documents
  that formatting a percentage is a locale question (3,4 % vs 3.4 %, Arabic
  numerals) that *the component does not own*; `sk-skeleton`'s shimmer direction
  is set by the consumer for the same reason. Both are recorded in their source
  comments and in their registry `ai` blocks rather than assumed.
- **`localesCovered: ["en-US"]` on every registry entry** is therefore a claim
  with a narrow meaning: it names the locale under which the component's
  behaviour was tested, not a locale the component imposes. A component with
  zero strings still lists it, because "no strings" and "tested in English" are
  the same observation here. A test asserts the field exists on every entry.
- **No locale API, and no `Intl` usage, because nothing needs one yet.** Adding
  a `locale` prop to a Button would be a prop that cannot affect anything — the
  exact failure ADR-013 exists to prevent.

### The condition that reverses this

This ADR is reversed by the **first** of these to happen, whichever comes
first:

- Any of Date Picker, Date Range Picker, Number Input, or Pagination enters the
  component set, or Table gains sorting. At that point §6 applies in full and
  must be implemented **before** that component ships, not after — which is
  what §6 was warning about.
- A shipped component acquires a user-visible string of its own. Then the
  documented locale API becomes mandatory for it.

Both are cheap to detect: the first is a new directory under
`packages/web-components/src/components/`, the second is a hardcoded English
string in a component source.

### What is deliberately not decided here

- **Which locale API.** `locale` prop per component, a provider, or a module
  setting — the right shape depends on how many components need it, and
  choosing now with zero consumers is how a project gets an API its first real
  user has to work around.
- **The tested-versus-manually-reviewed locale list.** §6 asks for a published
  split. With `en-US` as the only entry, publishing a two-column table with one
  row on the left and nothing on the right documents the absence more clearly
  than prose does, and that is what the registry `localesCovered` field is for
  today.

## Evidence

- No `Intl` usage and no `locale` prop in any of the 27 shipped component
  sources; the only `locale` matches in the workspace are the registry field
  itself and its tests.
- No `packages/` entry imports a date or number library.
- `sk-progress.tsx` and `sk-skeleton.tsx` record the locale boundary explicitly
  in their source comments, and both propagate to `components.d.ts`.
- §7's Tier 3 — the tier holding all five motivating components — has no
  representative in the shipped set. Date Picker, Date Range Picker, Number
  Input, and Pagination are absent; `sk-table` ships without sorting.

## What would reverse it

- A locale-dependent component being added without this ADR being superseded
  first, which is the breaking-change scenario §6 names.
- Evidence that a shipped component's behaviour actually varies by locale
  despite having no strings — for example a measured formatting difference in
  `sk-progress` — which would move it from "consumer's job" to "our job".
