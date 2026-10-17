// Order matters and mirrors the documented consumer path (packages/svelte
// README): tokens first, then the component stylesheet, then the app's own CSS.
// Vite emits these as stylesheet links into the built `index.html`, so the server
// render serves styled markup instead of referencing a file by hand.
import "@santaka-ui/tokens/css/index.css"
import "@santaka-ui/web-components/santaka.css"
import "@santaka-ui/styles/index.css"

import { hydrate } from "svelte"
import App from "./App.svelte"
import { defineSantakaElements } from "./define-elements.js"

/**
 * The client entry: defines the elements, then hydrates the markup the server
 * rendered.
 *
 * Hydration is used rather than `mount` deliberately. `mount` would discard the
 * server's markup and re-render from scratch, which would make every test in
 * `e2e/` pass while proving nothing about the server render.
 */
const target = resolveTarget()

/**
 * Hydration comes first and registration second, and the order is the whole
 * point of this file. The elements render into their own light DOM (ADR-011:
 * scoped styles, no shadow root), so upgrading one mutates the tree Svelte is
 * hydrating — and Svelte 5 abandons hydration when the server's nodes do not
 * match its template, clearing the target and mounting again. Registering second
 * keeps the server's markup, which is the only reason this example renders on
 * the server at all. `define-elements.ts` carries the measurement.
 */
hydrate(App, { target })

void defineSantakaElements()

/**
 * Returns the hydration target or throws. Narrowing `getElementById` here rather
 * than asserting at the call site keeps the null check and the value that passed
 * it together: a `const` narrowed in an earlier statement is not narrowed inside
 * a later function body, so the check has to live where the value is used.
 */
function resolveTarget(): HTMLElement {
  const element = document.getElementById("app")
  if (element === null) {
    throw new Error("[svelte] index.html has no #app element to hydrate into")
  }
  return element
}
