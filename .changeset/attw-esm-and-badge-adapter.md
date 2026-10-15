---
"@santaka-ui/react": minor
---

The universal package shipped Badge without an adapter, and the React JSX declarations and test stub had never heard of the tag, so a consumer writing sk-badge directly in JSX would have hit a type error. Badge is now exported with the WCAG 1.4.1 requirement enforced in the type system: <Badge dot /> does not compile without statusLabel, because a dot conveys state by color alone.

Four ADRs added for decisions that source comments already cited without the record existing. ADR-001 keeps Stencil over Lit and states the evidence, including the 358 KB of unreachable CommonJS as a genuine point against it. ADR-002 records that the token pipeline is hand-rolled rather than style-dictionary, because the contrast gate is a hard requirement that style-dictionary does not model. ADR-004 covers scope and license. ADR-005 covers the eager/lazy registration paths and is explicit that the Next.js SSR proof is still owed.

plan.md checkboxes are raised only where evidence exists, and each carries that evidence inline. docs/STATUS.md is rewritten against the current tree.
