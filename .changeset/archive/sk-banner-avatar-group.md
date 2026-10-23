---
"@santaka-ui/web-components": minor
"@santaka-ui/react": minor
"@santaka-ui/vue": minor
"@santaka-ui/svelte": minor
"@santaka-ui/core": minor
---

Adds `sk-banner` and `sk-avatar-group` — the last two Tier 1 components section 7
names that had not shipped.

**Banner** is the page-level counterpart to `sk-alert`: it spans its container
above the content it is about, where an alert sits in the flow and belongs to one
section. The geometry decides the ARIA, and one choice is the component's whole
reason for being careful:

- `role="region"`, **not** `role="banner"` — in ARIA `banner` is the site header
  and is one-per-page, so using it here would collide with the consumer's real
  `<header>` and leave two "banner" landmarks.
- A `region` is only exposed as a landmark when it has an accessible name, so
  `aria-label` or `aria-labelledby` is required for the banner to be reachable at
  all. The React type enforces one of the two; an unnamed banner is left unnamed
  rather than given a made-up label.
- It is not a live region: a banner was already present when the page loaded, and
  announcing it as an interruption would talk over the content the reader came
  for. `sk-alert` and `sk-toast` own that contract.

**AvatarGroup** stacks avatars and collapses the tail into a count:

- `role="group"` with the consumer's label, not a `list` — these are people, and
  "list, 5 items" plus five stops is worse than one sentence.
- The overflow is a `<span>` with `aria-label="N more"`, not a fourth avatar:
  "+3" is not a person, and a circle would have no name to announce.
- Avatars past `max` get `display: none`, which removes them from the
  accessibility tree. Without that, a screen reader reads five names while the
  page shows three plus "+2". The attribute is written rather than the nodes
  removed, so raising `max` returns the consumer's markup.
- Overlap is a negative `margin-inline-start`, so it mirrors in RTL; nothing is
  absolutely positioned, so the row reflows at narrow widths.

The avatars are slotted `sk-avatar` elements rather than a data array — a
`people={[...]}` prop would put name and initials logic in two places, which is
the duplication `sk-avatar` was designed to avoid.

Coverage: 7 browser tests each in `e2e/banner.e2e.ts` and
`e2e/avatar-group.e2e.ts`. Both negative-tested — swapping the banner's role to
`banner` fails two tests, and disabling the overflow-hiding fails one — which is
the evidence the assertions are load-bearing rather than restatements of the
source. Storybook stories, and declarations in the React, Vue, and Svelte
packages.
