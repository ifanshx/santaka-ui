---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/tokens": minor
"@santaka-ui/web-components": minor
---

SSR proof (examples/nextjs, ADR-005):
- Next.js 15 fixture renders every shipped component server-side and
  registers nothing until the client calls defineCustomElements — the
  lazy path. test:ssr asserts against the production build: tags with
  public attributes in the server output, zero customElements.define
  across 38 server chunks, clean hydration, scoped 3px stroke applied.
- The fixture forced the React JSX declarations to actually ship: tsc
  never re-emits a .d.ts input, so they exist only in-repo. Now exported
  as @santaka-ui/react/jsx with an exports-contract test. The fixture's
  typecheck also caught name missing from three intrinsics.

Automated a11y (ADR-008):
- axe-core scans the vanilla example (every component, documented
  states) in light, dark, and invalid-submit states; WCAG 2.0/2.1
  A+AA tags pinned, no rules disabled.
- First run found four real defect classes, all fixed:
  1. sk-separator aria-orientation on role=none (aria-allowed-attr)
  2. sk-tabs never assigned role=tablist (aria-required-parent)
  3. sk-tab nested a real button inside role=tab (nested-interactive):
     host is the tab now, Enter/Space owned by the widget
  4. Dark contrast: danger (4.09:1) as error text -> danger-fg
     everywhere, incl. removing a color-mix override that downgraded
     the base rule; primary (3.39:1) as ghost/link text -> new
     --sk-color-primary-text token (dark: violet.400, 7.09:1),
     gated at 4.5:1 — contrast gates 25 -> 27.
