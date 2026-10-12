import { describe, expect, it } from "vitest"
import { getComponent, searchComponents } from "./registry.js"
import type { RegistryItem } from "./types.js"

function item(name: string, overrides: Partial<RegistryItem> = {}): RegistryItem {
  return {
    schemaVersion: 1,
    name,
    namespace: null,
    type: "component",
    frameworks: ["react", "web-components"],
    stability: "stable",
    behaviorOwner: "web-components",
    version: "1.0.0",
    dependencies: {},
    peerDependencies: {},
    registryDependencies: [],
    files: [{ path: `${name}.tsx`, type: "registry:ui", checksum: `sha256-${"b".repeat(64)}` }],
    cssVariables: [],
    localesCovered: ["en-US"],
    license: "MIT",
    ai: {
      summary: `The ${name} component.`,
      whenToUse: [`Use ${name} for its specific job.`],
      whenNotToUse: ["Something else is a better fit — use a Link"],
      accessibility: "button pattern",
      example: `<${name} />`,
      localesCovered: ["en-US"],
      knownLimitations: [],
    },
    ...overrides,
  }
}

const index = {
  items: [
    item("select"),
    item("combobox", {
      stability: "preview",
      ai: {
        ...item("combobox").ai,
        summary: "Text input with a filtered list of suggestions.",
        whenToUse: ["Free-text input with suggestions is valid"],
        whenNotToUse: ["Options are known — use a Select"],
      },
    }),
    item("tabs"),
  ],
}

describe("searchComponents", () => {
  it("ranks an exact name match above a substring match", () => {
    const results = searchComponents(index, "select")
    expect(results[0]?.name).toBe("select")
  })

  it("returns stable components before preview ones for an equal score", () => {
    const results = searchComponents(index, "options")
    const names = results.map((entry) => entry.name)
    const lastStable = names.lastIndexOf("select")
    const firstPreview = names.indexOf("combobox")
    expect(lastStable < firstPreview || firstPreview === -1).toBe(true)
  })

  it("returns nothing when no term matches", () => {
    expect(searchComponents(index, "zzzz")).toEqual([])
  })

  it("filters by framework", () => {
    const vueOnly = { items: [item("select", { frameworks: ["vue"] })] }
    expect(searchComponents(vueOnly, "select", { framework: "react" })).toEqual([])
    expect(searchComponents(vueOnly, "select", { framework: "vue" })).toHaveLength(1)
  })

  it("ignores single-character noise terms", () => {
    expect(searchComponents(index, "a")).toEqual([])
  })

  it("surfaces whenNotToUse so the caller can see the alternative", () => {
    const [first] = searchComponents(index, "combobox")
    expect(first?.whenNotToUse[0]).toContain("Select")
  })
})

describe("getComponent", () => {
  it("finds by name", () => {
    expect(getComponent(index, "tabs")?.name).toBe("tabs")
  })

  it("returns undefined for an unknown name", () => {
    expect(getComponent(index, "nope")).toBeUndefined()
  })

  it("returns undefined when the framework is not supported", () => {
    expect(getComponent(index, "tabs", "angular")).toBeUndefined()
  })
})
