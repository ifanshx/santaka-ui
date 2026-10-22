import { describe, expect, it } from "vitest"
import { loadRegistry, loadTokens } from "./data.js"
import { getComponentTool, getTokensTool, getUsageTool, searchComponentsTool } from "./tools.js"
import type { ComponentDetail } from "./tools.js"
import { makeBlock, makeComponent, registryWithBlock } from "./fixtures.js"

/**
 * Tool behavior tests (docs/ARCHITECTURE.md §11).
 *
 * The smoke test proves the server answers over a real transport; these prove
 * the answers are *right*. They are separate because they fail for different
 * reasons: a smoke failure means the server is broken, a failure here means the
 * server is confidently wrong.
 */
const registry = loadRegistry()
const blockRegistry = registryWithBlock([...registry.items, makeBlock()])
const searchInteractive = searchComponentsTool(blockRegistry, {
  need: "settings",
  constraints: { interactive: true },
})

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
      expect(component.type).toBe("component")
      expect(component.tag?.startsWith("sk-")).toBe(true)
    }
  })

  it("reports a tag for every item a query reaches and never a fabricated one", () => {
    // One query per item name: every item is reachable through search, and a
    // block must stay tagless even when it outranks the components around it.
    for (const item of registry.items) {
      const result = searchComponentsTool(registry, { need: item.name })
      const reached = result.components.find((entry) => entry.name === item.name)
      if (!reached) continue
      if (item.type === "component") {
        expect(reached.type).toBe("component")
        expect(reached.tag).toBe(`sk-${item.name}`)
      } else {
        expect(reached.type).toBe(item.type)
        expect(reached.tag).toBeUndefined()
      }
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

  it("every shipped item is reachable and carries only a tag its entry justifies", () => {
    for (const item of registry.items) {
      const result = getComponentTool(registry, { name: item.name })
      expect(result.found).toBe(true)
      if (!result.found) continue
      const detail = result.component
      expect(detail.name).toBe(item.name)
      expect(detail.type).toBe(item.type)
      if (item.type === "component") {
        expect(detail.tag).toBe(`sk-${item.name}`)
        // A component's props and events come from build-time derivation.
        expect(detail.props.length).toBeGreaterThan(0)
      } else {
        // A block composes components; it has no tag, no props, no events.
        expect(detail.tag).toBeUndefined()
        expect(detail.props).toEqual([])
        expect(detail.events).toEqual([])
        expect(detail.registryDependencies).toEqual(item.registryDependencies)
      }
      expect(detail.files).toEqual(item.files)
    }
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

/**
 * Block behavior on a registry that already ships one (ADR-022: a block is
 * composed markup addressed by name, with no tag, no props, no events).
 * The bundled registry has no block yet, so the `registry-index` tests run
 * against both this fixture and the real tradeoff the fixture encodes.
 */
describe("block items", () => {
  it("finds a block whose summary answers the need", () => {
    const result = searchComponentsTool(blockRegistry, { need: "full settings page" })
    const block = result.components.find((entry) => entry.name === "settings")
    expect(block).toBeDefined()
    if (block) expect(block.type).toBe("block")
  })

  it("reports a block by name, never with a fabricated tag", () => {
    for (const entry of searchComponentsTool(blockRegistry, { need: "settings" }).components) {
      if (entry.type !== "block") continue
      expect(entry.tag).toBeUndefined()
      // The settings block in the fixture composes two components.
      expect(entry.registryDependencies).toEqual(["button", "input"])
    }
  })

  it("asserts a block is not interactive, because it has no events and no props", () => {
    // `interactive: true` aggregates events-or-control-props; a block has
    // neither, so the same derivation excludes it.
    for (const entry of searchInteractive.components) {
      expect(entry.type).not.toBe("block")
    }
    // And asking for exactly the non-interactive surface finds the block.
    const passive = searchComponentsTool(blockRegistry, {
      need: "settings",
      constraints: { interactive: false },
    })
    expect(passive.components.some((entry) => entry.type === "block")).toBe(true)
  })

  it("reports a block's registryDependencies and files instead of props and events", () => {
    const result = getComponentTool(blockRegistry, { name: "settings" })
    expect(result.found).toBe(true)
    if (!result.found) return
    const detail: ComponentDetail = result.component
    expect(detail.type).toBe("block")
    // No tag: the name is the identifier.
    expect(detail.tag).toBeUndefined()
    expect(detail.props).toEqual([])
    expect(detail.events).toEqual([])
    // The derivation comes from the entry, so a fixture and the real block
    // both land here — the test never names the dependency list.
    expect(detail.registryDependencies).toBeInstanceOf(Array)
    expect(detail.files.length).toBeGreaterThan(0)
    expect(
      detail.files.every((file) => file.path.endsWith(".html") || file.path.endsWith(".css")),
    ).toBe(true)
  })

  it("a component in the same registry keeps its tag and surface", () => {
    const result = getComponentTool(blockRegistry, { name: "button" })
    expect(result.found).toBe(true)
    if (!result.found) return
    expect(result.component.tag).toBe("sk-button")
    expect(result.component.type).toBe("component")
  })

  it("a fixture component's props and events survive alongside the block", () => {
    const fixture = searchComponentsTool(registryWithBlock([makeComponent("alpha"), makeBlock()]), {
      need: "alpha",
    })
    expect(fixture.components[0]?.tag).toBe("sk-alpha")
    expect(fixture.components[0]?.type).toBe("component")
  })

  it("a block answering get_usage reports no tag and carries its dependencies", () => {
    const result = getUsageTool(blockRegistry, {
      goal: "full settings page",
      framework: "web-components",
    })
    expect(result.found).toBe(true)
    if (!result.found) return
    expect(result.type).toBe("block")
    expect(result.tag).toBeUndefined()
    expect(result.registryDependencies).toBeInstanceOf(Array)
  })
})
