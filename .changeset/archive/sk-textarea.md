---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

A textarea is an input with a different rendered element, so its form participation, validation reporting, label wiring, and change-event rule moved into shared/form-control-base.ts rather than being written twice. The first pass had all of it inline in sk-input, and writing a textarea meant facing the decision plan section 4 risk R4 names: copy 150 lines and accept two things to fix whenever accessibility behavior changes, or extract it.

The extraction is not cosmetic. The base first read and wrote a plain state object, which looks simpler but is a snapshot: it wrote to a copy the component never saw, and the field silently stopped submitting. It now reads and writes through accessors. All twenty input tests pass unchanged after the refactor, which is what says the behavior was preserved.

Three defects the tests found. minlength and maxlength were dropped entirely, because Stencil maps the camelCase prop to min-length rather than the native minlength. required was never passed to the textarea at all, so the host carried it and the browser never saw it and valueMissing could never fire. And there is no pattern prop, since a textarea has no single-line grammar for a pattern to constrain, and one that was accepted and silently ignored would be worse than one that does not exist.

There is no size prop either: a textarea sizes itself from rows, which is the axis the browser already renders. The field resizes vertically by default, because long-form text is edited rather than typed in one line.
