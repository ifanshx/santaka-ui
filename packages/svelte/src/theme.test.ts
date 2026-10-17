import { get } from "svelte/store"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { preference, setTheme, theme, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./theme.js"

/**
 * The theme store's contract, from section 6: **one storage key and one document
 * attribute**. Two writers reach the page — this store, and the inline snippet
 * that has to run before first paint — and they agree because they read and
 * write the same two places rather than because they call each other.
 *
 * `setTheme` writing a key is not the interesting claim; the interesting claims
 * are that the attribute follows, that the store follows the attribute when
 * something else changes it, and that the snippet would set the attribute the
 * store then reads. Those are what make the snippet-and-store pair a contract
 * instead of two implementations of the same idea.
 */

/**
 * jsdom implements no `matchMedia`, so the store's own calls would throw. The
 * definition matches `packages/react/src/theme.test.ts`, and the listener list is
 * kept so a media `change` can be delivered the way a browser would deliver it.
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

/** Runs the pre-paint snippet the way a browser does: as a program. */
function runInitScript() {
  new Function(THEME_INIT_SCRIPT)()
}

const attribute = () => document.documentElement.getAttribute("data-sk-theme")

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("data-sk-theme")
  setPrefersDark(false)
})

/** A throwing test must not leave the storage spy in place for the next one. */
afterEach(() => {
  vi.restoreAllMocks()
})

describe("preference resolution", () => {
  it("treats an absent or unreadable preference as system", () => {
    expect(get(preference)).toBe("system")
    // An unknown stored value is not a preference, so it must not be adopted.
    localStorage.setItem(THEME_STORAGE_KEY, "sepia")
    const unsubscribe = theme.subscribe(() => {})
    unsubscribe()
    expect(get(preference)).toBe("system")
  })

  it("resolves system through the media query, not to a fixed theme", () => {
    const unsubscribe = theme.subscribe(() => {})
    unsubscribe()
    expect(get(theme)).toBe("light")

    setPrefersDark(true)
    const second = theme.subscribe(() => {})
    second()
    expect(get(theme)).toBe("dark")
  })
})

describe("setTheme", () => {
  it("writes the storage key and the document attribute together", () => {
    setTheme("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(attribute()).toBe("dark")

    setTheme("light")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    expect(attribute()).toBe("light")
  })

  it("stores the preference and publishes the resolved theme", () => {
    setPrefersDark(true)
    setTheme("system")
    // The stored value stays what the consumer chose...
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system")
    // ...while what is in effect is the resolution of it.
    expect(attribute()).toBe("dark")
    expect(get(preference)).toBe("system")
    expect(get(theme)).toBe("dark")
  })
})

describe("the attribute as the single source of truth", () => {
  it("follows the attribute when another writer changes it", async () => {
    const unsubscribe = theme.subscribe(() => {})
    try {
      // A consumer's own inline script, or a second copy of the snippet on the
      // page: the store must adopt it rather than keep its own answer.
      document.documentElement.setAttribute("data-sk-theme", "dark")
      await vi.waitFor(() => expect(get(theme)).toBe("dark"))

      document.documentElement.setAttribute("data-sk-theme", "light")
      await vi.waitFor(() => expect(get(theme)).toBe("light"))
    } finally {
      unsubscribe()
    }
  })

  it("re-reads both sources when it restarts, so hydration adopts the pre-paint value", () => {
    // Nothing subscribed yet: the value the module computed at import.
    const first = theme.subscribe(() => {})
    first()

    // Between the server render and hydration the snippet runs and can replace
    // the value. A restart is the only moment the store reads again.
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    document.documentElement.setAttribute("data-sk-theme", "dark")

    const seen: string[] = []
    const second = theme.subscribe((value) => seen.push(value))
    second()
    expect(seen.at(-1)).toBe("dark")
    expect(get(preference)).toBe("dark")
  })
})

describe("THEME_INIT_SCRIPT", () => {
  it("sets the attribute the store reads, from the stored preference", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    runInitScript()
    expect(attribute()).toBe("dark")

    localStorage.setItem(THEME_STORAGE_KEY, "light")
    runInitScript()
    expect(attribute()).toBe("light")
  })

  it("resolves system through the media query", () => {
    setPrefersDark(true)
    runInitScript()
    expect(attribute()).toBe("dark")

    setPrefersDark(false)
    runInitScript()
    expect(attribute()).toBe("light")
  })

  it("leaves the page alone instead of throwing when storage is unavailable", () => {
    // A browser in a storage-denied context: the snippet runs before first
    // paint, so an exception here would be an error on every page load.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage is denied")
    })
    document.documentElement.setAttribute("data-sk-theme", "light")

    expect(() => runInitScript()).not.toThrow()
    expect(attribute()).toBe("light")
  })
})
