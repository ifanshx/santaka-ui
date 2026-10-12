/**
 * Universal Web Components entrypoint.
 *
 * Importing this module registers every custom element. That is the documented
 * default behavior for `@santaka-ui/web-components`: the eager path for plain
 * HTML, React, Vue, Svelte, and Angular, where the tag is known at build time.
 *
 * Registration comes from the `customElementsExportBehavior` setting in
 * `stencil.config.ts`, not from a side effect in this file.
 *
 * SSR frameworks that render the tag during a server pass should instead
 * import `@santaka-ui/web-components/loader` and call
 * `defineCustomElements(window)` from client code (ADR-005), which keeps
 * hydration from upgrading tags the server already produced.
 */
export { SkButton } from "./components/sk-button/sk-button.js"
export { SkIconButton } from "./components/sk-icon-button/sk-icon-button.js"
export { SkLink } from "./components/sk-link/sk-link.js"
export type { ButtonSize, ButtonType, ButtonVariant } from "./components/shared/button-base.js"

/** Custom element tags this package defines. */
export const COMPONENTS = ["sk-button", "sk-icon-button", "sk-link"]
