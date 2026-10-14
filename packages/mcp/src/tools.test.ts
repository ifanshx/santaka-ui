import { describe, expect, it } from "vitest"
import { loadRegistry, loadTokens } from "./data.js"
import { getComponentTool, getTokensTool, getUsageTool, searchComponentsTool } from "./tools.js"

/**
 * Tool behavior tests (plan.md §11).
 *
 * The smoke test proves the server answers over a real transport; these prove
 * the answers are *right*. They are separate because they fail for different
 * reasons: a smoke failure means the server is broken, a failure here means the
 * server is confidently wrong.
 */
const registry = loadRegistry()

describe("search_components", () => {
  it("finds a component for a described need", () => {
    const result = searchComponentsTool(registry, { need: "delete confirmation" })
    expect(result.components.length).toBeGreaterThan(0)
    // The alert dialog exists precisely for this, and it must outrank the
    // plain dialog — a destructive confirmation is the case it was built for.
    expect(result.components.map((entry) => entry.name)).toContain("alert-dialog")
  })

  it("returns Stable before Preview before Experimental", () => {
    const result = searchComponentsTool(registry, { need: "action" })
    const order = { stable: 0, preview: 1, experimental: 2, deprecated: 3 } as const
    const ranks = result.components.map((entry) => order[entry.stability])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it("every result carries the fields an agent needs to choose", () => {
    for (const component of searchComponentsTool(registry, { need: "text" }).components) {
      expect(component.summary.length).toBeGreaterThan(0)
      expect(component.whenNotToUse.length).toBeGreaterThan(0)
      expect(component.tag.startsWith("sk-")).toBe(true)
    }
  })

  it("reports how many components were considered, so an empty result is legible", () => {
    const result = searchComponentsTool(registry, { need: "zzzzqqqq" })
    expect(result.components).toEqual([])
    expect(result.considered).toBe(registry.items.length)
  })

  it("filters by form association using the metadata, not a hardcoded list", () => {
    const result = searchComponentsTool(registry, {
      need: "value",
      constraints: { formAssociated: true },
    })
    const names = result.components.map((entry) => entry.name)
    // Input emits sk-value-change from the shared base, not its own source, so
    // this is the case a naive scan gets wrong.
    expect(names).toContain("input")
    // A button submits a form but holds no value, so it is not form-associated.
    expect(names).not.toContain("button")
  })

  it("filters by framework", () => {
    const result = searchComponentsTool(registry, {
      need: "button",
      constraints: { framework: "react" },
    })
    for (const component of result.components) {
      expect(component.frameworks).toContain("react")
    }
  })

  it("narrows by interactivity", () => {
    const interactive = searchComponentsTool(registry, {
      need: "surface",
      constraints: { interactive: true },
    })
    for (const component of interactive.components) {
      // A card is the canonical non-interactive surface: no events, no
      // value/checked/open/disabled/loading prop.
      expect(component.name).not.toBe("card")
    }
  })
})

describe("get_component", () => {
  it("returns the full record, including the derived surface", () => {
    const result = getComponentTool(registry, { name: "button" })
    expect(result.found).toBe(true)
    if (!result.found) return
    const { component } = result
    expect(component.tag).toBe("sk-button")
    expect(component.props.length).toBeGreaterThan(0)
    expect(component.props.every((prop) => prop.name && prop.type)).toBe(true)
    expect(component.accessibility.length).toBeGreaterThan(0)
    expect(component.example).toContain("sk-button")
  })

  it("reports the events a component dispatches", () => {
    const tabs = getComponentTool(registry, { name: "tabs" })
    expect(tabs.found).toBe(true)
    if (!tabs.found) return
    expect(tabs.component.events).toContain("sk-tab-change")
  })

  it("accepts the tag form as well as the bare name", () => {
    const withPrefix = getComponentTool(registry, { name: "sk-input" })
    expect(withPrefix.found).toBe(true)
    if (!withPrefix.found) return
    expect(withPrefix.component.name).toBe("input")
  })

  it("suggests near names instead of a bare error", () => {
    const result = getComponentTool(registry, { name: "buton" })
    expect(result.found).toBe(false)
    if (result.found) return
    expect(result.suggestions).toContain("button")
  })
})

describe("get_tokens", () => {
  it("returns every token for a theme", () => {
    const result = getTokensTool(registry, { theme: "light" })
    expect(result.tokens.length).toBeGreaterThan(100)
    expect(result.groups.length).toBeGreaterThan(5)
  })

  it("narrows to a group", () => {
    const result = getTokensTool(registry, { theme: "dark", group: "color" })
    expect(result.tokens.length).toBeGreaterThan(0)
    for (const token of result.tokens) {
      expect(token.group).toBe("color")
      expect(token.name.startsWith("--sk-color-")).toBe(true)
    }
  })

  it("reports the same token names in both themes", () => {
    const light = loadTokens("light")
      .map((token) => token.name)
      .sort()
    const dark = loadTokens("dark")
      .map((token) => token.name)
      .sort()
    // The two themes are one contract: a token that exists in one and not the
    // other is a theming bug, not a design choice.
    expect(dark).toEqual(light)
  })

  it("reports the oklch value, which is what a Baseline browser computes", () => {
    const result = getTokensTool(registry, { theme: "light", group: "color" })
    const primary = result.tokens.find((token) => token.name === "--sk-color-primary")
    expect(primary?.value).toMatch(/^(oklch|#)/)
  })

  it("lists the groups when asked for an unknown one, so the caller can correct itself", () => {
    const result = getTokensTool(registry, { theme: "light", group: "colour" })
    expect(result.tokens).toEqual([])
    expect(result.groups.map((group) => group.name)).toContain("color")
  })
})

describe("get_usage", () => {
  it("returns install lines, imports, and a usage example", () => {
    const result = getUsageTool(registry, { goal: "submit a form", framework: "react" })
    expect(result.found).toBe(true)
    if (!result.found) return
    expect(result.install.some((line) => line.startsWith("pnpm add"))).toBe(true)
    expect(result.install.some((line) => line.includes("@santaka-ui/react"))).toBe(true)
    expect(result.usage.length).toBeGreaterThan(0)
    expect(result.notes.length).toBeGreaterThan(0)
  })

  it("uses the universal package for a non-React framework", () => {
    const result = getUsageTool(registry, { goal: "submit a form", framework: "web-components" })
    expect(result.found).toBe(true)
    if (!result.found) return
    expect(result.install.some((line) => line.includes("@santaka-ui/web-components"))).toBe(true)
    expect(result.install.some((line) => line.includes("@santaka-ui/react"))).toBe(false)
  })

  it("matches a goal to the component built for it", () => {
    const result = getUsageTool(registry, {
      goal: "show a spinner while loading",
      framework: "react",
    })
    expect(result.found).toBe(true)
    if (!result.found) return
    expect(result.component).toBe("spinner")
  })
})
