---
"@santaka-ui/web-components": minor
"@santaka-ui/react": minor
"@santaka-ui/vue": minor
"@santaka-ui/svelte": minor
"@santaka-ui/core": minor
---

Adds `sk-kbd`, the last of the five Tier 1 components section 7 names that had
not shipped.

The component renders a real `<kbd>` element in the light DOM rather than a
`<span>` styled to look like one. That is the whole contribution: a shortcut
written as a bare span is two characters to a sighted reader and unmarked text
to anyone listening, with no way to distinguish "Shift" the key from "shift"
the word. It takes no role and no tab stop, and there is no `as` prop — the
element is the feature, so a prop that replaced it would remove the only thing
the component adds.

The monospace family is functional rather than decorative: "l", "1", and "I"
are the same glyph in most UI faces, and a shortcut is a string a reader copies
by eye.

There is no `variant` prop. Section 4's two-prop rule governs components that
have an axis to vary on, and a prop here would exist only to be unused.

Coverage: 6 browser tests in `e2e/kbd.e2e.ts`, negative-tested by replacing
`<kbd>` with `<span>` — five of the six fail, which is the evidence the
element assertion is load-bearing rather than a restatement of the source. A
Storybook story, and declarations in the React, Vue, and Svelte packages.
