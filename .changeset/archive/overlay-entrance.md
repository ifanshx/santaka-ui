---
"@santaka-ui/web-components": patch
"@santaka-ui/styles": patch
---

The floating layer now actually animates on open.

`sk-glass-enter` was declared in `styles/src/glass.css` and referenced by
nothing. Every overlay looked correct at rest, so nothing failed: the keyframes
were a comment with an `@keyframes` in front of it. Section 2 splits motion by
layer — controls press on `ease-arcade`, overlays float on `ease-glass` — and a
static overlay was that half of the design missing.

Dialog, Alert Dialog, Toast, and Tooltip now enter with `sk-glass-enter` on
`--sk-duration-overlay` and `--sk-ease-glass`. Alert Dialog needed its own rule
rather than inheriting Dialog's: Stencil scopes component CSS, so sharing the
`.sk-dialog__panel` class does not share the stylesheet, and the most urgent
overlay in the system was the one that appeared with no transition at all. Its
stylesheet claimed the reduced-motion ruling lived in `glass.css`, which was true
of a rule that had no animation to turn off.

The reduced-motion ruling is per component, beside the rule it turns off, because
`.sk-glass { animation: none }` is a single class and cannot outrank
`sk-dialog .sk-dialog__panel[open]` even inside a media query. The rule in
`glass.css` stays for consumers who animate `.sk-glass` themselves, and now says
so.

`materials.e2e.ts` asserts the animation that *started*, not the declared
property, and compares its duration and curve against the tokens rather than
against literals. Negative-tested twice: replacing the dialog's `animation` with
`none` fails with "declares no entrance animation", and removing the alert
dialog's rule — the component that had none — fails with "declared but never
started".
