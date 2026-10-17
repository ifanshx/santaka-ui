// Shared loader for the block example pages.
//
// The block source is the single source of truth: the `.html` in
// `/packages/web-components/src/blocks/<name>/` is fetched and injected into
// the designated slot of the page, and the block's own `.css` is linked
// alongside it. Nothing here copies or re-authorizes the markup, so a block
// edit shows up on the example page the next time it loads.
//
// Except for injecting the fetched markup exactly once, this script adds no
// state and owns no behavior — a block is markup plus layout CSS only.

/**
 * The static server at the repo root exposes the block sources under their
 * packaged path. The registry copy (`santaka add`) mirrors the same files, so
 * a consumer project ends up with identical markup after `add`.
 */
export async function loadBlock(name, mountId) {
  const mount = document.querySelector(`#${mountId}`)
  if (!mount) return

  const response = await fetch(`/packages/web-components/src/blocks/${name}/${name}.html`)
  if (!response.ok) {
    mount.textContent = `block "${name}" could not be loaded (${response.status})`
    return
  }

  // `innerHTML` so fragment comments ship along with the element tree: the
  // comments are part of the block's authored content, and the strip-then-
  // inject path would drop them silently.
  mount.innerHTML = await response.text()

  // Fire an event so a page that needs to react (e.g. an axe scan's hydration
  // wait) can key off it. Nothing in the block listens.
  mount.dispatchEvent(new CustomEvent("sk-block:loaded", { bubbles: true, detail: { name } }))
}
