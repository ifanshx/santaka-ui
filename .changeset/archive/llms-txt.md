---
"@santaka-ui/core": minor
---

Both files were v1.0 gaps named twice in the plan. They are now generated from
data the repository already treats as its source of truth, so neither can drift
from the components: the registry ai blocks supply summary, when-to-use,
when-not-to-use, accessibility, example, and limitations; the committed
components.d.ts supplies the props with types, defaults, and doc comments. The
declaration file is read from src/ rather than dist/ so the generator runs on a
clean checkout with no build.

llms.txt is the curated index (what the system is, install, the token contract
with a count per group, the component list). llms-full.txt is the reference: 21
components with their props, accessibility notes, examples, and limitations. An
llms CI job regenerates and fails on a diff.

The prose in llms.txt is authored in the generator rather than derived, because
"what this library is" has no machine-readable source. Everything derivable is
derived.

One parser detail is recorded because it silently produced an empty reference
first. Stencil emits each component twice in components.d.ts — the class
interface, then the JSX.IntrinsicElements one — and they differ: the JSX
interface carries the form-associated `form` and `name` members the class
interface omits. A last-wins parse dropped every prop; first-only dropped the
form members. The parser merges both now, and the result is cross-checked
against the Stencil docs.json, where the prop sets match exactly.
