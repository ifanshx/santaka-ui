/**
 * Token pipeline (ADR-002).
 *
 * Pure functions only: flattening DTCG, resolving `{token.path}` references,
 * converting sRGB to OKLCH, and computing WCAG contrast. The build script
 * (`build-tokens.mjs`) wires these to the filesystem; the tests exercise these
 * directly, so the math is verified without running a build.
 */

/** WCAG 2.x relative luminance of an `#rrggbb` color. */
export function luminance(hex) {
  const channel = (value) => {
    const srgb = value / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function parseHex(hex) {
  const normalized = String(hex).replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Not a #rrggbb color: ${hex}`)
  }
  return [0, 2, 4].map((i) => Number.parseInt(normalized.slice(i, i + 2), 16))
}

/** WCAG 2.x contrast ratio between two `#rrggbb` colors. */
export function contrastRatio(hexA, hexB) {
  const a = luminance(hexA)
  const b = luminance(hexB)
  const [high, low] = a > b ? [a, b] : [b, a]
  return (high + 0.05) / (low + 0.05)
}

/** sRGB hex to OKLCH, so the emitted CSS stays readable instead of opaque. */
export function hexToOklch(hex) {
  const normalized = String(hex).replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(normalized.slice(i, i + 2), 16) / 255)
  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const chroma = Math.sqrt(a * a + bb * bb)
  let hue = (Math.atan2(bb, a) * 180) / Math.PI
  if (hue < 0) hue += 360

  const round = (value, precision = 4) => Number.parseFloat(value.toFixed(precision))
  const l4 = round(lightness)
  const c4 = round(chroma)
  const h2 = round(hue, 2)

  return { l: l4, c: c4, h: h2, css: `oklch(${l4} ${c4} ${h2})` }
}

/** Flatten a DTCG tree into `{ "group.token": leaf }`, ignoring `$` metadata. */
export function flatten(node, trail = [], out = {}) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue
    const path = [...trail, key]
    if (value && typeof value === "object" && "$value" in value) {
      out[path.join(".")] = value
    } else if (value && typeof value === "object") {
      flatten(value, path, out)
    }
  }
  return out
}

/**
 * Resolve every `{a.b.c}` reference against one lookup table.
 *
 * An unresolvable reference and a reference cycle both throw: a token that
 * silently resolves to nothing becomes an invalid custom property, which is the
 * failure this whole build exists to prevent.
 */
export function resolveAll(lookup) {
  const resolved = {}
  const resolving = new Set()

  const resolvePath = (path) => {
    if (path in resolved) return resolved[path].$value
    const leaf = lookup[path]
    if (!leaf) throw new Error(`unknown token reference "${path}"`)
    if (resolving.has(path)) throw new Error(`circular token reference at "${path}"`)
    resolving.add(path)

    let value = leaf.$value
    const reference = typeof value === "string" ? /^\{([a-z0-9.-]+)\}$/i.exec(value) : null
    if (reference) value = resolvePath(reference[1])

    resolving.delete(path)
    resolved[path] = { ...leaf, $value: value }
    return value
  }

  for (const path of Object.keys(lookup)) resolvePath(path)
  return resolved
}

/** Dotted token path to CSS custom-property suffix: `color.text` -> `color-text`. */
export function kebab(name) {
  return name
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
}

/** True when the leaf is a publishable color token with a hex value. */
export function isColorLeaf(path, value) {
  return path.startsWith("color.") && typeof value === "string" && /^#([0-9a-f]{6})$/i.test(value)
}
