---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

The component exists because of what the example page was doing before it: every heading carried an inline font-size token, which is the type step applied as a fragment. Size arrived; the weight and tracking the same token prescribes did not. A type scale whose steps must be assembled four tokens at a time is not a type scale -- it is three tokens and a hope they stay in sync.

variant names the step exactly as the token does and applies size, line-height, weight, and tracking together. The variant/size question from section 4 resolves by choosing variant for the step: size is the height scale every other component uses, and text has no intrinsic height of its own.

Two refusals recorded. No as prop: an element-choosing prop invites rendering an h3 because it looks right, which is how heading levels end up contradicting the document outline -- the element is picked in markup, the look here, and children render verbatim so the consumer's h1 stays a real h1. And no chrome: text is not a surface, so no stroke, no shadow, no press, no transition, and no reduced-motion block because there is nothing animating to reduce. A test asserts that absence so the design survives.

muted replaces the .sk-text-muted utility and joins the presentation booleans on ADR-013's open question -- the conformance test caught it, which is what the test is for. family=display is the one place a heading reaches for --sk-font-display; the default leaves font-family untouched.

The example page's inline heading styles are gone; every heading goes through the component, and a Typography section shows all ten steps. The runtime budget rose 11.46 to 11.60 KB with the eighth component measured, still under its 12 KB gate.
