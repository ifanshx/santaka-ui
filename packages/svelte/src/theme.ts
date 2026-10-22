/**
 * Theme switching (section 6, Theming and customization contract).
 *
 * The theme lives in `[data-sk-theme]` on `<html>` and the user's choice in the
 * `sk-theme` storage key. `THEME_INIT_SCRIPT` writes the attribute before first
 * paint from an inline snippet; this module observes the attribute, so several
 * components stay in sync without a custom event on every write.
 *
 * The snippet and the key are duplicated from `@santaka-ui/react` and
 * `@santaka-ui/vue` rather than imported from either: a Svelte application must
 * not pull in React or Vue to switch themes, and the three adapters are peers,
 * not one built on another. The duplication is a deliberate coupling to section
 * 6, not an oversight — a test asserts the snippet is byte-identical to the one
 * in `docs/ARCHITECTURE.md`, which is the document every adapter answers to. If the snippet
 * ever needs to change, it changes in `docs/ARCHITECTURE.md` first.
 *
 * This is a Svelte **store**, not a rune. Runes in a `.svelte.ts` module are
 * compiled by the Svelte compiler, and this package is compiled by `tsc` so that
 * a consumer installs plain JavaScript — shipping a `.svelte.ts` file would make
 * every consumer compile this package's source. A store needs no compiler, works
 * in a plain `.ts` module, and still gives `$theme` auto-subscription in a
 * component.
 */
import { derived, writable, type Readable } from "svelte/store"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "sk-theme"

/**
 * Inline snippet that must run before first paint to avoid a theme flash. Kept
 * byte-identical to the snippet documented in section 6 so the docs and the
 * implementation cannot drift.
 */
export const THEME_INIT_SCRIPT = `try{var v=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=v==='dark'||(v==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-sk-theme',d?'dark':'light')}catch{}`

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system"
}

function readPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "system"
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isPreference(stored) ? stored : "system"
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference
  if (typeof matchMedia === "undefined") return "light"
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

type ThemeState = {
  /** The consumer's stored choice, which may be "system". */
  preference: ThemePreference
  /** The theme actually in effect, after resolving "system". */
  theme: ResolvedTheme
}

/**
 * The single observable behind both public stores.
 *
 * One observable rather than one per store, because two `writable` stores would
 * attach two `MutationObserver`s and two media listeners to answer the same two
 * questions. Svelte runs a store's start function when its first subscriber
 * arrives and the returned teardown when the last one leaves, which is the
 * refcount the adapters need: nothing is observed until something is listening,
 * and an application that only calls `setTheme` never starts an observer at all.
 *
 * The initial value is computed at import, so it is correct on the server
 * (`readPreference` and `resolve` both handle the absent browser globals). After
 * hydration the start function re-reads both sources, so the attribute written
 * by `THEME_INIT_SCRIPT` wins over the value the server rendered with.
 */
const state = writable<ThemeState>(initialState(), (set) => {
  if (typeof document === "undefined") return

  // Re-read on start: between the server render and hydration, the inline
  // snippet may have replaced the theme the markup was rendered with.
  set(initialState())

  // The attribute is the single source of truth: `THEME_INIT_SCRIPT`, a
  // consumer's own inline script, and this store all read and write it, so
  // observing it keeps every subscriber in agreement without a custom event.
  const observer = new MutationObserver(() => {
    const attribute = document.documentElement.getAttribute("data-sk-theme")
    if (attribute === "light" || attribute === "dark") {
      set({ preference: readPreference(), theme: attribute })
    }
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-sk-theme"],
  })

  // While the preference is "system", the OS is also a source of truth. The
  // change event carries the new value; re-reading `media.matches` would be a
  // second source of truth for the same fact.
  const media = matchMedia("(prefers-color-scheme: dark)")
  const onChange = (event: MediaQueryListEvent) => {
    if (readPreference() === "system") {
      set({ preference: "system", theme: event.matches ? "dark" : "light" })
    }
  }
  media.addEventListener("change", onChange)

  return () => {
    observer.disconnect()
    media.removeEventListener("change", onChange)
  }
})

function initialState(): ThemeState {
  const preference = readPreference()
  return { preference, theme: resolve(preference) }
}

/**
 * The theme actually in effect, after resolving "system".
 *
 * Subscribe with `$theme` in a component. The value is observed from the
 * document attribute rather than tracked locally, so `THEME_INIT_SCRIPT`, a
 * consumer's own script, and this store all agree on one source of truth.
 */
export const theme: Readable<ResolvedTheme> = derived(state, (current) => current.theme)

/** The consumer's stored choice, which may be "system". */
export const preference: Readable<ThemePreference> = derived(state, (current) => current.preference)

/**
 * Writes the storage key and the document attribute together, then updates the
 * stores. Writes the two sources directly rather than waiting for the observer:
 * a `MutationObserver` callback is a microtask, so a caller that writes and then
 * reads `theme` in the same tick would otherwise see the old value.
 */
export function setTheme(next: ThemePreference): void {
  if (!isPreference(next)) {
    throw new RangeError(
      `[santaka-ui] setTheme: expected "light", "dark", or "system"; received ${JSON.stringify(next)}`,
    )
  }

  localStorage.setItem(THEME_STORAGE_KEY, next)
  const resolved = resolve(next)
  document.documentElement.setAttribute("data-sk-theme", resolved)
  state.set({ preference: next, theme: resolved })
}
