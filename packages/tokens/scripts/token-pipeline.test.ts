import { describe, expect, it } from "vitest"
import {
  contrastRatio,
  flatten,
  hexToOklch,
  isColorLeaf,
  kebab,
  resolveAll,
} from "./token-pipeline.mjs"

/**
 * The token pipeline is where a wrong number becomes a silent visual bug, so
 * its math is tested rather than trusted. The figures below are the ones
 * recorded in the token descriptions in section 6 of docs/ARCHITECTURE.md.
 */
describe("contrastRatio", () => {
  it("returns 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2)
  })

  it("returns 1:1 for identical colors", () => {
    expect(contrastRatio("#6D28D9", "#6D28D9")).toBeCloseTo(1, 5)
  })

  it("is symmetric", () => {
    expect(contrastRatio("#17141C", "#FFFFFF")).toBeCloseTo(contrastRatio("#FFFFFF", "#17141C"), 6)
  })

  it("matches the recorded values for the starter palette", () => {
    expect(contrastRatio("#17141C", "#FFFFFF")).toBeCloseTo(18.21, 1)
    expect(contrastRatio("#5F5A6B", "#FFFFFF")).toBeCloseTo(6.64, 1)
    expect(contrastRatio("#6D28D9", "#FFFFFF")).toBeCloseTo(7.1, 1)
    expect(contrastRatio("#DC2626", "#FFFFFF")).toBeCloseTo(4.83, 1)
    expect(contrastRatio("#15803D", "#FFFFFF")).toBeCloseTo(5.02, 1)
    expect(contrastRatio("#92400E", "#FFFFFF")).toBeCloseTo(7.09, 1)
  })

  it("measures the dark-theme primary against the dark surface", () => {
    expect(contrastRatio("#7C3AED", "#0F0D14")).toBeCloseTo(3.39, 1)
  })

  it("rejects a color that is not six hex digits", () => {
    expect(() => contrastRatio("#FFF", "#FFFFFF")).toThrow()
    expect(() => contrastRatio("rebeccapurple", "#FFFFFF")).toThrow()
  })
})

describe("hexToOklch", () => {
  it("maps white to lightness 1", () => {
    expect(hexToOklch("#FFFFFF").l).toBeCloseTo(1, 2)
  })

  it("maps black to lightness 0", () => {
    expect(hexToOklch("#000000").l).toBeCloseTo(0, 2)
  })

  it("reports near-zero chroma for a neutral gray", () => {
    expect(hexToOklch("#808080").c).toBeCloseTo(0, 2)
  })

  it("keeps hue in the 0-360 range for a saturated color", () => {
    const coral = hexToOklch("#F97362")
    expect(coral.c).toBeGreaterThan(0.05)
    expect(coral.h).toBeGreaterThanOrEqual(0)
    expect(coral.h).toBeLessThanOrEqual(360)
  })

  it("emits CSS the browser can parse", () => {
    expect(hexToOklch("#6D28D9").css).toMatch(/^oklch\(-?[\d.]+ [\d.]+ [\d.]+\)$/)
  })

  it("keeps lightness within a hair of the sRGB value", () => {
    // A meaningful lightness error would visibly shift the palette in every
    // browser that supports oklch, so the tolerance is tight on purpose.
    expect(Math.abs(hexToOklch("#6D28D9").l - 0.4907)).toBeLessThan(0.01)
  })
})

describe("flatten", () => {
  it("joins nested keys with dots", () => {
    expect(flatten({ a: { b: { $value: 1 } } })).toEqual({ "a.b": { $value: 1 } })
  })

  it("skips DTCG metadata keys", () => {
    expect(flatten({ $description: "x", a: { $value: 1 } })).toEqual({ a: { $value: 1 } })
  })

  it("treats a group without $value as a path segment", () => {
    expect(flatten({ a: { b: { c: { $value: "x" } } } })).toEqual({
      "a.b.c": { $value: "x" },
    })
  })
})

describe("resolveAll", () => {
  it("resolves a reference to a literal", () => {
    const resolved = resolveAll({
      "color.brand": { $value: "#6D28D9" },
      "color.primary": { $value: "{color.brand}" },
    })
    expect(resolved["color.primary"]?.$value).toBe("#6D28D9")
  })

  it("resolves a chain of references", () => {
    const resolved = resolveAll({
      a: { $value: "#FFFFFF" },
      b: { $value: "{a}" },
      c: { $value: "{b}" },
    })
    expect(resolved.c?.$value).toBe("#FFFFFF")
  })

  it("throws on an unknown reference rather than emitting an invalid token", () => {
    expect(() => resolveAll({ a: { $value: "{nope}" } })).toThrow(/unknown token reference/)
  })

  it("throws on a circular reference instead of hanging", () => {
    expect(() => resolveAll({ a: { $value: "{b}" }, b: { $value: "{a}" } })).toThrow(
      /circular token reference/,
    )
  })

  it("throws on a self-reference", () => {
    expect(() => resolveAll({ a: { $value: "{a}" } })).toThrow(/circular token reference/)
  })

  it("preserves the leaf metadata", () => {
    const resolved = resolveAll({ a: { $value: "#FFFFFF", $description: "White" } })
    expect(resolved.a?.$description).toBe("White")
  })

  it("leaves a value that only looks like a reference alone", () => {
    const resolved = resolveAll({ a: { $value: "calc(1px)" } })
    expect(resolved.a?.$value).toBe("calc(1px)")
  })
})

describe("kebab", () => {
  it("converts dotted paths to dashes", () => {
    expect(kebab("color.text-muted")).toBe("color-text-muted")
  })

  it("leaves an already-kebab name alone", () => {
    expect(kebab("space-1")).toBe("space-1")
  })
})

describe("isColorLeaf", () => {
  it("accepts a six-digit hex under the color group", () => {
    expect(isColorLeaf("color.primary", "#6D28D9")).toBe(true)
  })

  it("rejects a shorthand hex", () => {
    expect(isColorLeaf("color.primary", "#FFF")).toBe(false)
  })

  it("rejects a non-color token", () => {
    expect(isColorLeaf("radius.md", "0.375rem")).toBe(false)
  })

  it("rejects a color outside the color group", () => {
    expect(isColorLeaf("shadow.sm", "#000000")).toBe(false)
  })
})
