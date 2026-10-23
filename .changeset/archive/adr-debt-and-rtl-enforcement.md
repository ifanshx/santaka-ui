---
"@santaka-ui/web-components": patch
---

Five ADRs were cited from source while their documents did not exist. ADR-011
appeared in fourteen files — README, CONTRIBUTING, stencil.config.ts, and the
components themselves — ADR-012 in next.config.mjs, ADR-018 in
eslint.config.js. A citation that resolves to nothing is worse than no
citation: it reads as a decision that was made and recorded, so nobody asks
the question again.

Each is written from the evidence in the repository, not from intent:

- ADR-003: the universal package owns every component's behavior and React
  adapts. Section 4 names Radix as the exception that makes React the owner;
  the workspace has no Radix dependency at all, so the default is the actual
  rule for all twenty-one components.
- ADR-011: scoped styles, never a shadow root. The decision is about what a
  consumer may style — a shadow root is opaque to consumer utility classes and
  to the data-slot hooks the library documents — and its cost is recorded: the
  <slot> element does not survive scoped mode, so a slot[name="footer"]
  selector silently matches nothing. That is how the first sk-card.css styled
  its separator.
- ADR-012: ESM-only with one exports table per package, and the two defects the
  contract caught. 358 KB of unreachable CommonJS that nothing measured,
  because the exports table did not name it; and Stencil's directory-specifier
  re-exports, which broke the shipped types under node16. Both were invisible
  to the test suite, which resolves through the workspace rather than the
  packed tarball.
- ADR-016: logical properties, and direction read from
  getComputedStyle().direction at interaction time.
- ADR-018: the adopted toolchain, and every deviation from section 5 named —
  style-dictionary, size-limit, knip, Storybook, the docs site, and the CLI are
  absences, not decisions with alternatives.

The RTL ban on physical properties was prose in section 4 and checked by
nothing, so the first component to write margin-left would have looked correct
in a left-to-right review. conventions.e2e.ts now reads every stylesheet,
strips comments (a rule that explains the ban must not trip it), and fails on
any banned pattern, naming the file and the declaration. Verified by negative
test. All twenty-one components were already clean.

14 of 18 ADRs now exist; the four missing ones (006, 007, 009, 015) are
deadlines for work that has not started.
