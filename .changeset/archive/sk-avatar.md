---
"@santaka-ui/web-components": minor
"@santaka-ui/react": minor
"@santaka-ui/vue": minor
"@santaka-ui/svelte": minor
"@santaka-ui/core": minor
---

Adds `sk-avatar`, one of the five Tier 1 components section 7 names that had not
shipped.

An avatar is a picture of a person, which makes it *meaningful* rather than
decorative, and that framing decides three things:

- The host carries `role="img"` and the person's name; the `<img>` inside is
  `alt=""` and the initials are `aria-hidden`. Putting the name on the `<img>`
  would leave the initials as a second, competing announcement of one person.
- An avatar with neither a name nor initials is `aria-hidden`, not an empty
  `role="img"`. An unnamed image is an axe violation, and the tempting fix —
  defaulting the label to a word like "avatar" — announces the designer's word
  instead of the person's name.
- `data-state` distinguishes `absent` from `error`. They paint identically and
  are two different bugs: one is a consumer who passed no `src`, the other a
  broken URL. Nothing else in the component can tell them apart.

Initials are derived from `name`, never supplied separately — two fields that
can disagree are how an avatar shows "JD" while announcing "Jane Doe". The
parser takes first and last word only, because name order, particles, and
single-name cultures are locale questions and section 6 says locale is
consumer-supplied.

The circle is a deliberate departure from ADR-017's zero radius: a portrait is
not chrome, and a square with no radius reads as a cropped document rather than
a person.

Coverage: 8 browser tests in `e2e/avatar.e2e.ts`, negative-tested by emptying
the host's `aria-label` — two tests fail, which is the evidence the accessible
name is asserted rather than assumed. A Storybook story, and declarations in the
React, Vue, and Svelte packages.
