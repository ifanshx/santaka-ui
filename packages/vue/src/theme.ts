import { defineComponent, h, onScopeDispose, readonly, ref, type Ref } from "vue"

/**
 * Theme switching (section 6, Theming and customization contract).
 *
 * The theme lives in `[data-sk-theme]` on `<html>` and the user's choice in the
 * `sk-theme` storage key. `ThemeScript` writes the attribute before first paint
 * from an inline snippet; `useTheme` observes the attribute, so several
 * components stay in sync without a custom event on every write.
 *
 * The snippet and the key are duplicated from `@santaka-ui/react` rather than
 * imported from it: a Vue application must not pull in React to switch themes,
 * and the two adapters are peers, not one built on the other. The duplication is
 * a deliberate coupling to section 6, not an oversight — a test asserts the
 * snippet is byte-identical to the one in `docs/ARCHITECTURE.md`, which is the document both
 * adapters answer to. If the snippet ever needs to change, it changes in
 * `docs/ARCHITECTURE.md` first.
 */
export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "sk-theme"

const isPreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system"

/**
 * Inline snippet that must run before first paint to avoid a theme flash. Kept
 * byte-identical to the snippet documented in section 6 so the docs and the
 * implementation cannot drift.
 */
export const THEME_INIT_SCRIPT = `try{var v=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=v==='dark'||(v==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-sk-theme',d?'dark':'light')}catch{}`

/**
 * Renders the pre-paint theme script. Mount it in the document `<head>`.
 *
 * Rendered with `innerHTML` rather than a text child: the script's own body
 * contains `'` and `>` characters, and Vue escapes a text child, which would
 * ship a script that does nothing. `innerHTML` on a `<script>` element is the
 * only way to write executable script text, and the content is a compile-time
 * constant in this module — not consumer data.
 */
export const ThemeScript = defineComponent({
  name: "SkThemeScript",
  setup() {
    return () => h("script", { innerHTML: THEME_INIT_SCRIPT })
  },
})

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

export type UseThemeReturn = {
  /** The theme actually in effect, after resolving "system". */
  theme: Readonly<Ref<ResolvedTheme>>
  /** The consumer's stored choice, which may be "system". */
  preference: Readonly<Ref<ThemePreference>>
  /** Writes the storage key and the document attribute together. */
  setTheme: (next: ThemePreference) => void
}

/**
 * Read and write the theme.
 *
 * The resolved value is observed from the document attribute rather than tracked
 * locally, so `ThemeScript`, a consumer's own script, and this composable all
 * agree on one source of truth.
 *
 * This is a Vue composable, so it must be called from `setup()` — the
 * `MutationObserver` and the media listener are torn down through
 * `onScopeDispose`, which is the Vue equivalent of the React effect's cleanup.
 */
export function useTheme(): UseThemeReturn {
  const preference = ref<ThemePreference>("system")
  const theme = ref<ResolvedTheme>("light")

  if (typeof document !== "undefined") {
    const initial = readPreference()
    preference.value = initial
    theme.value = resolve(initial)

    // The attribute is the single source of truth: `ThemeScript`, a consumer's
    // own inline script, and this composable all read and write it, so observing
    // it keeps every mounted component in agreement without a custom event.
    const observer = new MutationObserver(() => {
      const attribute = document.documentElement.getAttribute("data-sk-theme")
      if (attribute === "light" || attribute === "dark") theme.value = attribute
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
      if (readPreference() === "system") theme.value = event.matches ? "dark" : "light"
    }
    media.addEventListener("change", onChange)

    onScopeDispose(() => {
      observer.disconnect()
      media.removeEventListener("change", onChange)
    })
  }

  const setTheme = (next: ThemePreference): void => {
    if (next !== "light" && next !== "dark" && next !== "system") {
      throw new RangeError(
        `[santaka-ui] setTheme: expected "light", "dark", or "system"; received ${JSON.stringify(next)}`,
      )
    }
    localStorage.setItem(THEME_STORAGE_KEY, next)
    preference.value = next
    const resolved = resolve(next)
    document.documentElement.setAttribute("data-sk-theme", resolved)
    theme.value = resolved
  }

  return { theme: readonly(theme), preference: readonly(preference), setTheme }
}
