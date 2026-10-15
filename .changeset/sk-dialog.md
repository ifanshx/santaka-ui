---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

Tier 2 opens. The dialog renders the native <dialog> element, which the Baseline tier guarantees (Chrome 111 / Safari 16.4) -- making it a dependency, not an enhancement, and the whole implementation strategy: focus trapping, Escape, ::backdrop, and inert background content are the browser's job. A component that reimplements focus trapping will lose focus in exactly the case nobody tested; this one never has the chance.

State ownership follows section 4: open/closed is ephemeral, so there is no defaultOpen. The open prop is the single source of truth for intent, the native showModal/close methods are the only things that act on it, and every path -- trigger click, Escape, backdrop, a consumer setting the prop -- reports through one sk-open-change event. Focus returns to the invoker on close, so a keyboard user is never dropped at the top of the document.

Three defects the browser tests caught, none visible from source. display:flex outranked [hidden], so a closed panel stayed on screen -- and the inverse mattered too: Stencil's scoped-mode slot manager writes hidden on elements it thinks are empty slot fallbacks, including the open panel, so the rule is two-sided. Slotted content never reached the panel: light-DOM slot distribution does not carry host children into a programmatically-built subtree, so the panel rendered three empty slots and initial focus fell to body -- fixed by a one-time move of non-trigger children at upgrade, deliberately not a MutationObserver fighting Stencil's render. And a trigger-open was unobservable: the click handler set the prop but nothing dispatched the event, caught by the event test resolving false where it expected true.

The backdrop is translucent ink, not blur: the glass panel already blurs what is directly under it, and double-blurring the page is expensive and looks like a bug. dismissible is off by default because a dialog holding form input loses work to a stray click. The React package gains the compound parts section 4 names -- Dialog, DialogTrigger, DialogContent -- as conveniences over slot attributes. Runtime budget raised 13 to 14 KB with the rationale recorded in measure-bundle.mjs; the per-component CSS average has fallen on every addition and now sits at 2.02 KB.
