import { render } from "svelte/server"
import App from "./App.svelte"

/**
 * The server entry: render the page to markup, with no DOM and no custom
 * elements defined.
 *
 * `svelte/server`'s `render` runs the component graph once and returns the
 * markup, which is what makes the SSR claim testable: `<sk-input>` leaves this
 * function as an HTML tag the browser parses, and the element upgrades later
 * when the client bundle defines it. Nothing here touches `window`, so the
 * output is the same in Node as it would be on any other server.
 *
 * Only `body` is returned. The `head` half is `svelte:head` output with no
 * consumers here — the document's head is owned by `index.html`, which Vite
 * builds and the server fills.
 */
export function renderAppHtml(): string {
  return render(App).body
}
