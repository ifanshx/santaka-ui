import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, useTheme, type ThemePreference } from "./theme.js"

/**
 * These tests assert the theme contract from section 6: one storage key, one
 * document attribute, no custom event. A second source of truth is exactly how
 * two components end up disagreeing about the current theme.
 */
const mediaListeners: Array<(event: MediaQueryListEvent) => void> = []

function setPrefersDark(matches: boolean) {
  mediaListeners.length = 0
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("dark") ? matches : false,
      media: query,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.push(listener)
      },
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    }),
  })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("data-sk-theme")
  setPrefersDark(false)
})

describe("THEME_INIT_SCRIPT", () => {
  it("reads the same storage key useTheme writes", () => {
    expect(THEME_INIT_SCRIPT).toContain(`'${THEME_STORAGE_KEY}'`)
    expect(THEME_INIT_SCRIPT).toContain("data-sk-theme")
  })

  it("honors the OS preference when the stored value is system", () => {
    expect(THEME_INIT_SCRIPT).toContain("prefers-color-scheme: dark")
  })

  it("never throws when storage is unavailable", () => {
    expect(THEME_INIT_SCRIPT.startsWith("try{")).toBe(true)
    expect(THEME_INIT_SCRIPT.endsWith("catch{}")).toBe(true)
  })
})

describe("useTheme", () => {
  it("defaults to light when the OS prefers light", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.preference).toBe("system")
    expect(result.current.theme).toBe("light")
  })

  it("resolves to dark when the OS prefers dark", () => {
    setPrefersDark(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("dark")
  })

  it("writes the document attribute and the storage key together", () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme("dark"))
    expect(document.documentElement.getAttribute("data-sk-theme")).toBe("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
  })

  it("an explicit preference overrides the OS preference", () => {
    setPrefersDark(true)
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme("light"))
    expect(result.current.theme).toBe("light")
    expect(document.documentElement.getAttribute("data-sk-theme")).toBe("light")
  })

  it("returns to the OS preference when set back to system", () => {
    setPrefersDark(true)
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme("light"))
    act(() => result.current.setTheme("system"))
    expect(result.current.theme).toBe("dark")
  })

  it("reads an existing stored preference on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    const { result } = renderHook(() => useTheme())
    expect(result.current.preference).toBe("dark")
    expect(result.current.theme).toBe("dark")
  })

  it("ignores a corrupt stored value and falls back to system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon")
    const { result } = renderHook(() => useTheme())
    expect(result.current.preference).toBe("system")
  })

  it("observes the attribute, so a second component stays in sync", async () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      document.documentElement.setAttribute("data-sk-theme", "dark")
    })
    // MutationObserver delivers as a microtask, so the write is only visible to
    // React after the queue drains.
    await act(async () => {})
    expect(result.current.theme).toBe("dark")
  })

  it("follows the OS change while the preference is system", () => {
    setPrefersDark(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("light")
    act(() => {
      mediaListeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent))
    })
    expect(result.current.theme).toBe("dark")
  })

  it("does not follow the OS once an explicit preference is set", () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme("light"))
    act(() => {
      mediaListeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent))
    })
    expect(result.current.theme).toBe("light")
  })

  it("rejects an unsupported preference value", () => {
    const { result } = renderHook(() => useTheme())
    expect(() => act(() => result.current.setTheme("neon" as ThemePreference))).toThrow()
  })
})
