---
"@santaka-ui/web-components": patch
---

- Add SkSelect to src/index.ts: customElementsExportBehavior derives
  registration from exports, so the missing entry left sk-select
  un-upgraded in the eager path (no data-slot, no options, no form
  submission). Fixes all 11 select e2e failures and the runtime
  data-slot convention test.
- Conventions boolean scan: indeterminate is ARIA-mirroring (mixed
  aria-checked, native property name); default* props are uncontrolled
  initializers, not state mirrors. ADR-013 amended with both rulings.
