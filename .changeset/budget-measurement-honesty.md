---
"@santaka-ui/web-components": patch
---

The measurement fixture listed the exported classes by hand. When Input, Textarea, and Card landed, nothing added them to that list, so the fixture never imported them -- and tree-shaking correctly deleted them from the bundle. The reported figure stayed at 9.34 KB through three component additions, which reads as headroom and was in fact an unmeasured 22%.

That is worse than having no budget, because the number is still printed, still formatted in a table, and still looks authoritative. The list now derives from src/index.ts and throws if it finds no Sk* classes at all, so the failure mode is a loud error rather than a plausible number. The real figure is 11.46 KB against a 12 KB budget: still passing, but with 0.54 KB of headroom rather than the 2.66 KB that was being reported.

materials.e2e.ts asserts what the re-skin promised rather than restating each component's own stylesheet: chrome is hard-edged and glass rounds, so a build where glass had quietly become a third hard-edged surface would fail. It also covers the press, the 3px focus ring, disabled controls not animating, ghost being flat at rest but still lifting on hover, and reduced motion disabling the transition property rather than only flattening its duration -- a 1ms translate is still a translate.

Writing it closed two gaps in the example page. sk-icon-button[variant=primary] did not exist, so the icon button's raised state had never been measured in a browser -- only its ghost and danger variants were. And the badge dot was never checked against the pill's radius in the same assertion, so the rule that a dot is a circle while a badge is a square could break on either side unnoticed.
