import { defineCustomElements } from "@santaka-ui/web-components/loader"

/**
 * Register the custom elements before the React tree renders its controls.
 *
 * This is the eager path, and the reason it is legitimate here is that there is
 * no server render to protect: a Vite SPA has no HTML until the bundle runs, so
 * deferring registration into a `useEffect` would only mean the first paint
 * shows undefined elements — an unstyled flash of `<sk-input>` — with nothing
 * gained. The Next.js example takes the lazy path for the opposite reason
 * (ADR-005): there the markup exists before the JavaScript does.
 *
 * Called at module scope rather than inside a component so it runs once, and
 * returns a promise that is deliberately not awaited: the elements upgrade when
 * they upgrade, and every assertion in the test waits for the upgrade rather
 * than assuming it.
 */
void defineCustomElements(window)
