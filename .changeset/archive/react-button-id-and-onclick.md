---
"@santaka-ui/react": minor
---

Button and IconButton forward `id` and `onClick`.

Both props were dropped by the adapters, so a React consumer could render a
button and have no way to name it in the DOM or handle its click through the
component. The universal elements have carried the click since they were
written; only the wrapper was silent.

`id` is forwarded and never generated — a button is not a form control that
needs a label association, so an invented id would be an id the consumer did
not ask for.

`onClick` is typed as the element's own handler
(`MouseEventHandler<SkButtonElement>`), not a `MouseEvent` over a native
`<button>`. React 19 attaches a real `click` listener for `onClick` on a custom
element, so the handler fires for a user click and a dispatched event alike; the
jsdom tests in `button.test.tsx` and `adapters.test.tsx` pin the forwarding, and
the `Clickable` Storybook story asserts the handler is actually called in a real
browser (`apps/storybook`).
