# ADR-016: RTL strategy — logical properties and direction-derived keyboard behavior

- **Status:** Accepted
- **Date:** 2026-10-12
- **Plan deadline:** end of weeks 3–4 (`plan.md` §18)

## Context

`plan.md` §6's RTL section states the position in one line: *"RTL is a Definition
of Done item, not a follow-up. Retrofitting logical properties across forty
components is the expensive path."* This ADR records how that is made true, and
adds the enforcement the section implies but the repository did not have: until
this change, the ban on physical properties was stated in the plan and checked by
nothing.

## Decision

### Direction is an inherited attribute, not a build

There is no RTL build, no RTL stylesheet, and no per-component direction prop.
Direction comes from the `dir` attribute on any ancestor, which is what makes
`dir="rtl"` on `<html>` work with zero configuration. `sk-skeleton` has a
`direction` prop, but it is a **shimmer-travel** direction (which way the
gradient moves), not a text direction, and it defaults to `ltr` independently of
the document.

### Authored CSS uses logical properties exclusively

`margin-inline-start`, `padding-block`, `inset-inline-end`,
`border-start-start-radius`, `text-align: start`. Banned in component and shared
stylesheet source: `left`, `right`, `margin-left`, `padding-right`,
`text-align: left/right`, `border-top-left-radius` and its three siblings,
`float: left/right`.

**This is now enforced.** `e2e/conventions.e2e.ts` reads every component's
stylesheet, strips comments, and fails on any of the banned patterns. The
comment-stripping is deliberate: a rule that *explains* the ban in a comment must
not trip the ban. Before this test existed the convention was prose, and the
first component to write `margin-left` would have looked correct in a
left-to-right review — which is exactly how a convention decays.

### Direction-encoding icons mirror

An icon that encodes direction (chevron, arrow, undo, indentation guide) carries
`sk-icon--directional`, and `packages/styles/src/primitives.css` mirrors it under
`[dir="rtl"]` with `transform: scaleX(-1)`. One rule, applied by class, rather
than a mirrored SVG per direction.

### Horizontal keyboard semantics derive direction at interaction time

Arrow-key handling for a horizontal widget inverts under RTL, and the inversion
is read from the live computed style at the moment of the keypress — never from a
build-time flag or a captured value:

```ts
const rtl = getComputedStyle(this.host).direction === "rtl"
```

`sk-tabs` is the shipped case. The property this buys is that a tablist inside a
document with `dir="rtl"` gets Arrow-Right meaning *previous* for free, with no
configuration and no second code path. The same derivation is the contract for
Slider and Menubar when they land (§6 names them).

Reading it at interaction time rather than at connect time also means a
direction change mid-session — a language switch — is picked up without
re-registering the component.

### Coverage is a property of the spec, not a per-file promise

`plan.md` §6 requires that every component render in both directions and have at
least one RTL visual regression case. ADR-019 satisfies this structurally: the
`visual` project photographs every example-page section in light/ltr, light/rtl,
and dark/ltr. A new component section in the example automatically gains its RTL
baseline. This is the cheapest honest form of the requirement — the same
component photographed in both directions — and it cannot silently stop covering
a component the way a hand-written per-file RTL assertion can.

## Consequences

- A physical property in component CSS now fails the suite. The failure names the
  file and the offending declaration, because the cost of finding it later is the
  retrofit §6 warns about.
- `dir` is the only configuration surface. A consumer embedding a
  right-to-left region does not import a second stylesheet.
- Locale and direction are separate concerns: direction is `dir`, and locale
  (date, number, week-start) is consumer-supplied through `Intl` per §6's
  internationalization section. This ADR governs direction only.
- `sk-skeleton`'s `direction` prop is a documented near-miss on the word, and the
  component's own docs say so; it is not a text-direction prop.

## What would reverse this

A target environment where logical properties are unsupported — which would mean
revisiting the browser baseline (ADR-014), since logical properties are Baseline
well below it. Absent that, nothing here is contested; the reversal would be a
per-direction stylesheet, which is the cost this decision exists to avoid.
