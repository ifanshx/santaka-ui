import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { contrastRatio, flatten, isColorLeaf, kebab, resolveAll } from "./token-pipeline.mjs"

/**
 * Theme contract tests.
 *
 * The pipeline tests in `token-pipeline.test.ts` cover the math. These cover the
 * *relationships between tokens* — the invariants a build cannot check on its
 * own, because a token is only wrong relative to the theme it renders in. Each
 * one below exists because the invariant was actually broken at some point
 * during the neo-brutalist / glass token work, and a build gate would not have
 * caught it.
 */

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(here, "..", "src")

const read = (relativePath: string) => readFileSync(join(srcDir, relativePath), "utf8")

function theme(name: "light" | "dark") {
  const primitives = flatten(JSON.parse(read("color.primitives.json")))
  const dimensions = flatten(JSON.parse(read("dimensions.tokens.json")))
  const semantic = flatten(JSON.parse(read(join("themes", `${name}.tokens.json`))))
  return resolveAll({ ...primitives, ...dimensions, ...semantic })
}

const THEMES = ["light", "dark"] as const
type ThemeName = (typeof THEMES)[number]

/**
 * Strict lookup for one token. A missing token throws with its own path rather
 * than returning `undefined` and failing three assertions later with a message
 * that points at the wrong thing.
 */
function token(themeName: ThemeName, path: string) {
  const leaf = theme(themeName)[path]
  if (!leaf) throw new Error(`no such token: ${path} (${themeName})`)
  return leaf
}

/** Flatten a source file without resolving references, for source-level checks. */
function source(file: string) {
  return flatten(JSON.parse(read(file)))
}

function sourceTheme(name: ThemeName) {
  return source(join("themes", `${name}.tokens.json`))
}

/**
 * Resolve a token to the opaque hex `contrastRatio` can read. Theme tokens come
 * in two forms — a literal `#rrggbb`, or the `rgb(r g b / a)` alpha syntax the
 * glass group uses — and `resolveAll` may have rewritten a `{color.ramp}`
 * reference into either. Alpha is dropped deliberately: these contracts are
 * written against the color the panel resolves to at full opacity, which is
 * the worst case for a translucent fill over an unknown backdrop.
 */
function opaque(themeName: ThemeName, path: string) {
  const raw = String(token(themeName, path).$value)

  const hex = raw.match(/^#([0-9a-f]{6})$/i)
  if (hex?.[1]) return `#${hex[1].toUpperCase()}`

  const rgb = raw.match(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)/i)
  if (rgb) {
    const [r, g, b] = rgb.slice(1).map(Number) as [number, number, number]
    return `#${[r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`
  }

  throw new Error(`${path} is neither hex nor rgb() in ${themeName}: ${raw}`)
}

/** The alpha channel of an `rgb(r g b / a)` token. */
function alpha(themeName: ThemeName, path: string) {
  const raw = String(token(themeName, path).$value)
  const match = raw.match(/\/\s*([\d.]+)\)/)
  if (!match?.[1]) throw new Error(`${path} carries no alpha channel in ${themeName}: ${raw}`)
  return Number.parseFloat(match[1])
}

describe("glass fallback surface", () => {
  // This is the regression that motivated the whole file: `fallback` was
  // declared once in dimensions.tokens.json as a light value, so the dark theme
  // rendered light text on a near-white panel whenever a browser lacked
  // `backdrop-filter`. The panel became unreadable, and no gate failed.
  it("is declared per theme, so the dark theme never falls back to a light panel", () => {
    for (const name of THEMES) {
      expect(sourceTheme(name)["glass.fallback"], `glass.fallback in ${name}`).toBeDefined()
    }
  })

  it("gives each theme's fallback panel enough contrast against that theme's text", () => {
    for (const name of THEMES) {
      const ratio = contrastRatio(opaque(name, "color.text"), opaque(name, "glass.fallback"))
      // Text on the fallback has to clear the same 4.5:1 floor as text on any
      // other surface; a fallback that cannot is worse than no glass at all.
      expect(ratio, `text on glass.fallback (${name})`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("keeps the fallback near-opaque so content behind it does not bleed through", () => {
    for (const name of THEMES) {
      expect(
        alpha(name, "glass.fallback"),
        `glass.fallback alpha (${name})`,
      ).toBeGreaterThanOrEqual(0.95)
    }
  })
})

describe("theme-independent glass values", () => {
  // Only the effect values are shared. A color here would silently reappear in
  // every theme, which is exactly how the fallback bug happened.
  it("keeps blur and saturate in dimensions, out of the theme files", () => {
    const dimensions = source("dimensions.tokens.json")
    expect(dimensions["glass.blur"]).toBeDefined()
    expect(dimensions["glass.saturate"]).toBeDefined()

    for (const name of THEMES) {
      // Read the theme file, not the merged result: the point is that the color
      // is *not* shared, which a merged lookup cannot express.
      expect(
        sourceTheme(name)["glass.fallback"],
        `glass.fallback must live in ${name}.tokens.json`,
      ).toBeDefined()
      expect(
        dimensions["glass.fallback"],
        "glass.fallback must NOT be shared in dimensions.tokens.json",
      ).toBeUndefined()
    }
  })

  it("merges the shared effect values into both themes", () => {
    for (const name of THEMES) {
      expect(token(name, "glass.blur").$value).toBe("24px")
      expect(token(name, "glass.saturate").$value).toBe("180%")
    }
  })
})

describe("badge foreground-on-fill pairs", () => {
  // Section 4 holds a soft state fill to the text ratio, not to the page ratio:
  // the label sits on its own fill, so that is the pair that has to clear 4.5:1.
  const PAIRS = [
    { variant: "success", fg: "color.success-fg", bg: "color.success-subtle" },
    { variant: "warning", fg: "color.warning-fg", bg: "color.warning-subtle" },
    { variant: "danger", fg: "color.danger-fg", bg: "color.danger-subtle" },
  ] as const

  for (const name of THEMES) {
    for (const pair of PAIRS) {
      it(`${name} ${pair.variant} foreground clears 4.5:1 on its own fill`, () => {
        const ratio = contrastRatio(opaque(name, pair.fg), opaque(name, pair.bg))
        expect(ratio, `${pair.fg} on ${pair.bg} (${name})`).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
  // The recorded figures in the token descriptions, so the descriptions cannot
  // drift away from the values they document.
  it("matches the ratios recorded in the token descriptions", () => {
    expect(
      contrastRatio(opaque("light", "color.success-fg"), opaque("light", "color.success-subtle")),
    ).toBeCloseTo(4.86, 1)
    expect(
      contrastRatio(opaque("light", "color.warning-fg"), opaque("light", "color.warning-subtle")),
    ).toBeCloseTo(6.44, 1)
    expect(
      contrastRatio(opaque("light", "color.danger-fg"), opaque("light", "color.danger-subtle")),
    ).toBeCloseTo(5.7, 1)
    expect(token("light", "color.success-subtle").$description).toContain("4.86")
  })
})

describe("primary-subtle", () => {
  // The description claimed 7.72:1, which is `color.primary` on the fill. The
  // foreground a consumer reaches for on a subtle fill is `color.primary-fg`,
  // and in the light theme that pairing is 1.16:1. Worse, the two themes
  // disagree about which foreground suits the fill: light wants violet at
  // 6.10:1, dark wants white at 17.31:1. No component can hard-code one, so the
  // invariant that must hold is only that the description names a foreground
  // that actually clears the fill in that theme — otherwise the pairing is
  // guesswork, and it already was.
  const CANDIDATES = ["color.primary", "color.primary-fg"] as const

  for (const name of THEMES) {
    it(`names a foreground in ${name} that clears 4.5:1 on primary-subtle`, () => {
      const usable = CANDIDATES.filter((candidate) => {
        const ratio = contrastRatio(opaque(name, candidate), opaque(name, "color.primary-subtle"))
        return ratio >= 4.5
      })
      expect(usable.length, `usable foregrounds on primary-subtle (${name})`).toBeGreaterThan(0)

      const description = String(token(name, "color.primary-subtle").$description)
      // The description names the custom property a consumer writes, which is
      // the kebab form of the token path.
      const named = CANDIDATES.filter((candidate) =>
        description.includes(`--sk-${kebab(candidate)}`),
      )
      expect(named.length, `foregrounds named in description (${name})`).toBeGreaterThan(0)
      expect(
        usable.some((candidate) => description.includes(`--sk-${kebab(candidate)}`)),
        `description must name a usable foreground (${name}): ${description}`,
      ).toBe(true)
    })
  }

  it("does not claim primary-fg clears it, since that is false in the light theme", () => {
    for (const name of THEMES) {
      const description = String(token(name, "color.primary-subtle").$description)
      expect(description, `primary-subtle description (${name})`).not.toMatch(
        /Primary foreground on it is/,
      )
    }
  })
})

describe("shadow tokens", () => {
  // Hard offsets with zero blur. A blur radius creeping back in would soften the
  // treatment that the whole elevation ladder exists to create.
  it("emits offsets with no blur radius", () => {
    const dimensions = source("dimensions.tokens.json")
    for (const [path, leaf] of Object.entries(dimensions)) {
      if (!path.startsWith("shadow.") || !leaf) continue
      const value = String(leaf.$value)
      if (value === "none") continue
      // Shorthand is `<x> <y> <blur> <spread>`; the zero blur and spread are
      // written unitless because the whole ladder is unitless.
      const [x, y, blur, spread] = value.split(/\s+/)
      if (!x || !y || !blur || !spread) {
        throw new Error(`${path} is not an x/y/blur/spread shorthand: ${value}`)
      }
      expect(Number.parseFloat(blur), `${path} must have zero blur`).toBe(0)
      expect(Number.parseFloat(spread), `${path} must have zero spread`).toBe(0)
      expect(Number.parseFloat(x), `${path} must offset horizontally`).not.toBe(0)
    }
  })

  it("keeps brutal-shadow color out of the tokens, so one ladder serves both themes", () => {
    const dimensions = source("dimensions.tokens.json")
    for (const [path, leaf] of Object.entries(dimensions)) {
      if (!path.startsWith("shadow.") || !leaf) continue
      // A literal rgb() here is the dark-theme alpha hack that was removed: it
      // forced the dark theme to raise alpha on a blur that no longer exists.
      expect(String(leaf.$value), `${path} must not embed a color`).not.toMatch(
        /rgb|#[0-9a-f]{3,6}/i,
      )
    }
  })
})

describe("radius tokens", () => {
  it("keeps chrome nearly square while leaving circular shapes a full radius", () => {
    const dimensions = source("dimensions.tokens.json")
    // Chrome is 2-8px, not 0 and not the 10px of a soft, generic UI kit. This
    // assertion used to require exactly 0 — a fully sharp corner — which was the
    // neo-brutalist rule, and it read as unfinished once the components were
    // used at control sizes. It now pins the intent rather than one number: a
    // chrome radius stays small enough that the surface still reads as
    // hard-edged, and the steps grow monotonically.
    const chrome = ["sm", "md", "lg", "xl"] as const
    const px = chrome.map((step) => {
      const raw = String(dimensions[`radius.${step}`]?.$value)
      expect(raw, `radius.${step} must be in px`).toMatch(/^\d+px$/)
      return Number.parseInt(raw, 10)
    })
    for (const value of px) {
      expect(value, "chrome radius stays under a soft 10px").toBeLessThan(10)
    }
    for (let i = 1; i < px.length; i += 1) {
      const previous = px[i - 1]
      const current = px[i]
      expect(previous, `radius step ${i - 1} exists`).toBeTypeOf("number")
      expect(current, `radius step ${i} exists`).toBeTypeOf("number")
      expect(current as number, `radius step ${i} grows`).toBeGreaterThan(previous as number)
    }
    // The badge dot and the spinner are circles by shape, not by style.
    expect(dimensions["radius.full"]?.$value).toBe("9999px")
  })

  it("gives glass its own large radii rather than reusing the full radius", () => {
    const dimensions = source("dimensions.tokens.json")
    expect(dimensions["radius.glass"]?.$value).toBe("1.25rem")
    expect(dimensions["radius.glass-lg"]?.$value).toBe("1.75rem")
  })
})

describe("token emission", () => {
  it("publishes every semantic color as a resolvable hex leaf", () => {
    for (const name of THEMES) {
      for (const [path, leaf] of Object.entries(theme(name))) {
        if (!path.startsWith("color.") || !leaf) continue
        expect(isColorLeaf(path, leaf.$value), `${path} (${name})`).toBe(true)
      }
    }
  })
})
