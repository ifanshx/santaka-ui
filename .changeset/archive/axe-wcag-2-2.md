---
"@santaka-ui/web-components": minor
---

The axe scan now covers WCAG 2.2 AA, not only 2.0/2.1.

docs/ARCHITECTURE.md §12 names WCAG 2.2 AA as the product target, but `e2e/a11y.ts` pinned
`withTags` to the 2.0 and 2.1 tags only, so the scan could not fail on a 2.2
rule. The 2.2 tags are added to the same pinned ladder rather than replacing
it, so a rule that regresses to the 2.0 level still fails.

`wcag22aa` contributes one rule here — `target-size` — evaluated on 66 nodes
with no incomplete results, which is what says the tag runs rather than being
accepted vacuously. The project's own `--sk-touch-min` (44px) remains the
stricter gate above the WCAG 24px floor.
