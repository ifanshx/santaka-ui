---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

The seventh Tier 1 component and the first that is not a derivative of an existing one. Everything it shares with the rest of the system is chrome: a 3px stroke, no rounding, a zero-blur offset shadow. What it does not share is state. A card has no role, takes no focus, and owns nothing.

Three API decisions, each a refusal rather than an omission. No size prop: every other size is a height scale, and a card has no intrinsic height to scale. heading is a string, not a heading element: the card does not know its level in the document outline, and a hard-coded h3 inside a card in an h2 section contradicts the surrounding structure. And no click handler, because a clickable card is a link or a button wearing a card's styling, and adding an interaction prop here would produce something neither keyboard-reachable nor announced.

Scoped mode removes the slot element. ADR-011 puts these components in scoped rather than shadow encapsulation, which strips the slot and relocates the assigned nodes -- so a selector of slot[name=footer] matches nothing and its rules silently never apply, with no error and no warning. The first version of the stylesheet styled its footer separator exactly that way, and drew nothing. Everything stylable now hangs off a real wrapper, and a test asserts no sk-card slot exists in the light DOM so the next author to reach for one finds out immediately.

An optional slot still needs a guard. Rendering the footer wrapper unconditionally draws a rule across an empty band on every headerless card, which is worse than no footer. :empty handles it -- CSS ignores the comment nodes scoped mode leaves behind -- and the test verifies that rather than assuming it.

The prop is heading, not title. Stencil flags title as reserved because it is a standardized HTMLElement member; a prop by that name shadows the prototype property and the browser would render the heading as a hover tooltip over the entire card.

sk-card also forced the boolean-prop conformance guard to stop assuming every component has one. The assertion exists to prove its own regex is not vacuous, and it cannot apply to a component that genuinely has no booleans. Card is exempted by name, and the exemption is now guarded in the other direction: if every component were exempt the test would check nothing, which is worse than having no test.
