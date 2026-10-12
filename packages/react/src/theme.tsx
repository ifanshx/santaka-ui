import { useCallback, useEffect, useState, type ReactElement } from "react"

/**
 * Theme switching (section 6, Theming and customization contract).
 *
 * The theme lives in `[data-sk-theme]` on `<html>` and the user's choice in the
 * `sk-theme` storage key. `ThemeScript` writes the attribute before first paint
 * from an inline snippet; `useTheme` observes the attribute, so several
 * components stay in sync without a custom event on every write.
 */
export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "sk-theme"

const isPreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system"

/**
 * Inline snippet that must run before first paint to avoid a theme flash.
 * Kept byte-identical to the snippet documented in section 6 so the docs and
 * the implementation cannot drift.
 */
export const THEME_INIT_SCRIPT = `try{var v=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=v==='dark'||(v==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-sk-theme',d?'dark':'light')}catch{}`

/**
 * Renders the pre-paint theme script. Mount it in the document `<head>`; on the
 * server it renders nothing, so there is no hydration mismatch.
 */
export function ThemeScript(): ReactElement {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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

/**
 * Read and write the theme.
 *
 * The resolved value is observed from the document attribute rather than
 * tracked locally, so `ThemeScript`, a consumer's own script, and this hook all
 * agree on one source of truth.
 */
export function useTheme(): {
  theme: ResolvedTheme
  preference: ThemePreference
  setTheme: (next: ThemePreference) => void
} {
  const [preference, setPreference] = useState<ThemePreference>("system")
  const [theme, setThemeState] = useState<ResolvedTheme>("light")

  useEffect(() => {
    const initial = readPreference()
    setPreference(initial)
    setThemeState(resolve(initial))

    // The attribute is the single source of truth: `ThemeScript`, a consumer's
    // own inline script, and this hook all read and write it, so observing it
    // keeps every mounted component in agreement without a custom event.
    const observer = new MutationObserver(() => {
      const attribute = document.documentElement.getAttribute("data-sk-theme")
      if (attribute === "light" || attribute === "dark") setThemeState(attribute)
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
      if (readPreference() === "system") setThemeState(event.matches ? "dark" : "light")
    }
    media.addEventListener("change", onChange)

    return () => {
      observer.disconnect()
      media.removeEventListener("change", onChange)
    }
  }, [])

  const setTheme = useCallback((next: ThemePreference) => {
    if (next !== "light" && next !== "dark" && next !== "system") {
      throw new RangeError(
        `[santaka-ui] setTheme: expected "light", "dark", or "system"; received ${JSON.stringify(next)}`,
      )
    }
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setPreference(next)
    const resolved = resolve(next)
    document.documentElement.setAttribute("data-sk-theme", resolved)
    setThemeState(resolved)
  }, [])

  return { theme, preference, setTheme }
}
