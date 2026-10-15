---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/styles": minor
"@santaka-ui/tokens": minor
"@santaka-ui/utilities": minor
"@santaka-ui/web-components": minor
---

Establish the monorepo and ship the first vertical slice: tokens through a
button, proven in a real browser.

Tokens are DTCG source compiled to CSS custom properties for light and dark
themes. The build refuses to emit an unresolvable reference or a contrast pair
below its documented WCAG target, and writes a contrast report next to the
stylesheets.

The universal custom element owns Button behavior; the React package is a thin
adapter over it. That is the ownership rule from section 4, applied rather than
described.

Decisions worth flagging:

- Scoped styles, not Shadow DOM (ADR-011). Consumer CSS and Tailwind utilities
  reach component internals; styling hooks are data-slot attributes.
- Component CSS ships as a file rather than being injected at hydration. Stencil
  inlines CSS into the bundle by default, which breaks SSR extraction and
  reintroduces FOUC, so scripts/build-css.mjs concatenates it instead.
- attachInternals() is called in componentWillLoad, not a field initializer:
  Stencil assigns the @Element() property after the constructor.
- A form-associated custom element gets no implicit submission, so type="submit"
  calls form.requestSubmit() explicitly.
- Sizes control visual weight, not the hit area: --sk-touch-min (44px) is
  enforced at every size, including icon-only buttons.

pnpm run verify is the whole pipeline CI runs: format, lint, typecheck, tests,
build, bundle budgets, package validation. 95 tests, 10 of them in Chromium
against the built output rather than a test double.

Bundle budgets are measured, not asserted: 8.09 KB gzip for the runtime and
Button against a 12 KB budget, 3.09 KB of component CSS against 4 KB, and
9.33 KB of token themes against 12 KB.
