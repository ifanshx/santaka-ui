---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/svelte": minor
---

Registers the five components added previously — `sk-taka`, `sk-slider`,
`sk-breadcrumb`, `sk-pagination`, and `sk-drawer` — so they are reachable the way
every other component is. Until now they existed as elements and tests but were
absent from the registry, so `santaka add slider` could not install one and the
catalogue had no page for it.

- **Registry**: 36 entries now, each with `cssVariables` and the `ai` block §11
  requires — `summary`, `whenToUse`, `whenNotToUse`, `accessibility`, `example`,
  and `knownLimitations`. Validation caught one on the first run: Taka's
  `whenNotToUse` did not name an alternative component, which §11 makes
  mandatory. Fixed by naming Badge rather than loosening the rule.
- **React**: adapters for all five, plus element and JSX declarations.
- **Svelte**: element types, attribute types, and `SvelteHTMLElements` entries.
- **Storybook**: a story file for each.

The Drawer story also fixes a mistake worth noting: `slot="trigger"` was written
as a prop on the `Button` adapter, which TypeScript rejected — slot assignment is
the browser's, and the attribute has to sit on a real DOM element. The Banner
story hit the same thing earlier; the rule is now recorded in the Drawer story.
