---
"@santaka-ui/web-components": patch
"@santaka-ui/react": patch
---

Prove React form submission in a real browser (docs/ARCHITECTURE.md §16), and fix the two
defects it found.

`examples/react-vite/e2e/form-submission.e2e.ts` renders all six form controls
through `@santaka-ui/react`, submits a plain `<form>`, and reads the entries back
out of the browser's own `FormData`. It is the React half of the §16 gate; the
universal half was already covered, and the two are different claims — an adapter
that drops an attribute renders and validates correctly while the form submits
without the control.

**`Radio Group` submitted every field twice.** The inner radios carried the
group's `name` *and* the form-associated host called `setFormValue()`, so the
browser submitted both paths and every submission carried the field twice.
`FormData.get()` returned the first value and hid the duplicate; only counting
entries exposes it. The host no longer submits — the radios do. The radios had to
keep their shared `name`, because that is what groups them and what Firefox's
arrow-key navigation walks (measured: Chromium moved between radios without it,
Firefox did not).

**React `Checkbox` never forwarded `value`.** The element has always carried the
prop — `"on"` is the platform default — but the adapter dropped it, so a React
consumer could set the label and the name and still not choose what the form
received. `Switch` forwarded its own `value` all along; the asymmetry is what made
it visible.

Both are covered by regression tests: `getAll("env")` is asserted to be exactly one
entry, and `form-name.test.tsx` asserts `Checkbox` forwards `value` and still
defaults to `"on"`.

Also corrects the React Vitest worker bound, which was written as
`poolOptions.forks.maxForks` — removed in Vitest 4 and silently ignored, so the
bound it documented was never applied. It is now the Vitest 4 `maxWorkers`.
