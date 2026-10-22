# ADR-017: Starter token values, type scale, and motion values

- **Status:** Accepted (amends the values previously recorded in `docs/ARCHITECTURE.md` §6)
- **Date:** 2026-10-12
- **Supersedes:** the "Starter token values" tables in `docs/ARCHITECTURE.md` §6, lines 417–526

## Context

`docs/ARCHITECTURE.md` §6 fixed the v1.0 starter tokens and stated that "every value is a
decision, not a placeholder: change one and the change is a design change with a
contrast re-check, not a tweak." It also set a visual direction in §6 "Visual
identity": **Playful Engineering** — "polished and professional", with the
constraint that "typography and spacing should remain calm and readable" (§1.8:
"Playful, not distracting").

The shipped values were calm by construction: 4–12px corner radii, 1px borders,
a four-step blurred shadow ladder, and 120/200/320ms motion on a standard ease.

The product direction then changed. The library now targets **arcade
neo-brutalism for chrome and iOS glassmorphism for floating layers**, with
motion on both. That is a different visual language, not a restyle: it changes
geometry, borders, elevation, fills, motion timing, and typography for every
component that ships.

Doing this without recording it left the repository holding two conflicting
conventions at once — `docs/ARCHITECTURE.md` still documented `0.375rem` and
`0 1px 3px rgb(23 20 28 / 0.10)` as the starter values, while the compiled
tokens emitted `0` and `2px 2px 0 0`. §17 states the reason plainly:
"Undocumented defaults are how a project acquires two conflicting conventions."

## Decision

Adopt the neo-brutalist / glass system as the shipped token layer, and record
the departures from the previous values explicitly rather than silently.

### Shape

Chrome has no corner rounding. `radius.sm/md/lg/xl` are `0`. `radius.full`
remains `9999px` because a status dot and a spinner are circles *by shape*, not
by style choice. Glass overlays take new radii (`radius.glass` 1.25rem,
`radius.glass-lg` 1.75rem) rather than reusing `full`, so a floating panel can
never be mistaken for a pill.

### Borders

Two weights only. `border.width` stays `1px` for hairlines, separators, and
input fields; `border.thick` is `3px` and carries all brutalist chrome. The focus
ring becomes `ring.width` 3px at `ring.offset` 3px — a hard offset ring rather
than a soft glow, which is both the brutalist treatment and a higher-contrast
indicator than the 2px glow it replaces.

### Elevation

The blurred ladder is replaced by zero-blur hard offsets. `shadow.xs` …
`shadow.lg` keep their names so existing `var()` call sites keep resolving, and
`brutal`, `brutal-hover`, `brutal-active`, `brutal-none` are added. No shadow
token carries a color: the component supplies `--sk-color-shadow`, so one ladder
serves both themes.

This retires the dark-theme alpha hack. `shadowFor()` in the token build raised
alpha to 0.24/0.32/0.40/0.56 for the dark theme, which exists only because a
blurred shadow needs a different alpha to read. There is no alpha left to raise.

### Motion

Durations and easings are split by layer, so a component picks its personality
by reading one token rather than combining several:

| Layer | Durations | Easings |
|---|---|---|
| Interactive controls | `control-fast` 90ms, `control` 140ms, `control-slow` 180ms | `arcade` (overshoot), `arcade-exit` |
| Floating overlays | `overlay` 280ms, `overlay-slow` 420ms | `glass` (fast start, long settle), `glass-exit` |

`ease.arcade` is `cubic-bezier(0.34, 1.56, 0.64, 1)`; the overshoot past 1.0 is
deliberate and is what makes a press visibly spring back.

### Typography

`font.display` is added alongside `font.sans`. The declared stack is the platform
fallback: **no webfont ships in the default path**, which was already a recorded
decision in `docs/ARCHITECTURE.md` §6. The token exists so a consumer can swap in a geometric
or techno sans (Space Grotesk, Chakra Petch) by setting one custom property.
Two heavy display steps are added at weight 800 with tight tracking
(`text.display` -0.03em, `text.display-sm` -0.02em); the arcade character comes
from weight and tracking regardless of family.

### The shadow color is split from the stroke color

`color.shadow` is a shadow. `color.border-strong` is the visible chrome stroke.
They were initially one token, which cannot work: a shadow only darkens what is
under it, so on the dark theme `#0A0910` sits at 1.03:1 against `#0F0D14` —
invisible — and a 3:1 contrast gate against a dark surface is unsatisfiable in
principle. The stroke therefore uses the existing `color.border-strong`
(3.52:1 light, 3.46:1 dark, already gated at 3:1) and the `color.shadow` gate
applies to the light theme only.

## Evidence

- Every value above is emitted by `packages/tokens/dist/css/{light,dark}.css`
  and asserted by `packages/tokens/scripts/tokens.test.ts`.
- The brutalist chrome is measured in a real browser, not asserted from source:
  `packages/web-components/e2e/button.e2e.ts` reads `borderTopWidth` (3px),
  `borderTopLeftRadius` (0px), and a `box-shadow` with a zero blur radius.
- The press is measured too: hovering moves the control to `-2px -2px` and
  grows the shadow to `7px 7px`; pressing moves it to `3px 3px` and shrinks it
  to `2px 2px`.

## Consequences

- **Token names changed for consumers who overrode them.** `duration.fast`,
  `duration.normal`, `duration.slow`, `ease.standard`, `ease.exit`,
  `ease.emphasized`, and the old `radius.*` values no longer exist. A consumer
  with hard-coded overrides gets no effect from them. This is recorded in
  `.changeset/neo-brutalist-glass.md`.
- **The visual direction is louder than "calm and readable" reads.** Weight 800
  display type, hard offset shadows, and an overshoot ease are attention-grabbing
  by design. This is a deliberate departure from §6's stated tone and from §1.8's
  "playful, not distracting", and it is recorded here rather than left for
  someone to discover in the compiled CSS. If the tone is judged too loud after
  real use, the reversal is to soften `ease.arcade` and the display weights —
  both are single-token changes.
- **Glass is a second material, not a variation.** It is scoped to floating
  layers (dialog, popover, toast, tooltip, palette) and reads as genuinely
  floating only because everything around it is hard-edged. `styles/src/glass.css`
  owns it, feature-detected, with a solid per-theme fallback for browsers without
  `backdrop-filter`.

## What would reverse this

Evidence that the chrome reads as *noisy* rather than *arcade*: users mistaking
the shadow for a rendering artifact, or the hard edges fighting dense data views.
The reversal is per-surface, not global — `shadow.brutal-none` already exists so
a component can opt out of elevation without losing the stroke.