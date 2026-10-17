/**
 * `@santaka-ui/svelte` — Svelte 5 support for the `@santaka-ui/web-components`
 * custom elements.
 *
 * This package ships **no component wrappers**, and that is a measured decision
 * rather than a shortcut. Svelte's template compiler already takes the route the
 * Vue and React adapters have to build by hand. Its rule, read in the pinned
 * `svelte` 5.57.2 (`src/internal/client/dom/elements/attributes.js`,
 * `set_custom_element_data`): if the element is registered, Svelte asks it for the
 * setters it exposes and assigns the property when there is one, otherwise it
 * writes a stringified attribute; if the element is **not** registered yet — which
 * is the state during hydration, before `defineCustomElements()` — it falls back
 * to an object heuristic, assigning an object-valued prop as a property and
 * everything else as an attribute.
 *
 * Measured in `examples/svelte-vite`, which is what makes that more than a
 * reading of the library: `variant="primary"` reaches an un-upgraded
 * `<sk-button>` as an attribute, and `options` is asserted through both routes —
 * the attribute the server wrote and the property Svelte assigns — with the
 * element rendering the same options either way. The one thing a consumer must
 * know is what a React or Vue consumer must know too: a non-primitive prop is
 * serialized for the server render, because the *server* writes an array literal
 * as `[object Object]` in the markup the element then parses. Custom events bind
 * directly with the `onsk-value-change` spelling. A wrapper component would
 * therefore restate what the compiler already does, and section 4's ownership rule
 * says the element owns the behavior.
 *
 * What Svelte genuinely lacks is type safety and an SSR-safe theme store, so
 * those are what this package supplies:
 *
 *   - `@santaka-ui/svelte/elements` augments Svelte's own element types, so
 *     `<sk-button varaint="primary">` is a type error instead of a silently
 *     dropped attribute. Svelte's fallback for an unknown tag is
 *     `{ [name: string]: any }`, which accepts anything.
 *   - `theme` and `setTheme` read and write the one storage key and the one
 *     document attribute that section 6 defines.
 *
 * The element types are not re-exported here. They live in
 * `@santaka-ui/svelte/elements`, the same subpath that carries the module
 * augmentation, so there is one place to look and one place to reference — the
 * arrangement `@santaka-ui/react` uses for `@santaka-ui/react/jsx`. Import one
 * with `import type { SkInputElement } from "@santaka-ui/svelte/elements"`; a
 * type-only import emits nothing, so it costs no runtime.
 */
export { preference, setTheme, theme, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./theme.js"
export type { ResolvedTheme, ThemePreference } from "./theme.js"
