---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

They are deliberate opposites, and each one's accessibility ruling refutes the other's. The Spinner announces: role=status, the visible ring aria-hidden, and the label -- defaulting to "Loading" so omitting the words is a choice rather than an accident -- is what a screen reader says. The Skeleton hides: aria-hidden scaffolding with no label prop at all, because announcing five grey rectangles before a table loads is noise, the real content announces itself when it arrives, and a region that needs announcing while loading is a live region the consumer owns.

Reduced motion makes the same split. The spinner's spin stops -- animation: none, not a shorter duration, because a slow spinner still implies movement it cannot show, so the ring freezes solid and the label carries the whole story. The skeleton's shimmer is removed entirely: frozen mid-travel the highlight wedge reads as a rendering defect, and the grey shape is the message. It survives.

The skeleton accepts no children by type. Real content replaces the element; a children prop would let content be nested inside the scaffolding it exists to replace. The spinner's ring is icon-button's ring -- same construction, same 2px stroke, same control-slow duration, same reduced-motion ruling recorded in both files -- with keyframes duplicated rather than shared, since the build concatenates plain CSS and a shared partial would be a second source of truth for six lines.

Both join sk-card on the conformance guard's stateless exemption: neither has a state to toggle, and inventing a boolean to satisfy a vacuity guard would be the failure the guard exists to prevent. The guard's non-vacuity assertion still passes -- ten components scanned, three exempted.

Found en route: a mid-build barrel edit made Stencil compile the previous index.js, so spinner and skeleton silently never registered in the browser and every DOM-touching test timed out. A clean rebuild fixed it; the registry and example page confirmed the remaining wiring. Tier 1 stands at ten of twelve; Separator and Label remain.
