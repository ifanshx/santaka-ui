import { describe, expect, it } from "vitest"
import { validateRegistryItem } from "./validate-item.js"
import type { RegistryItem } from "./types.js"

function validItem(): RegistryItem {
  return {
    $schema: "https://santaka.my.id/schema/registry-item-v1.json",
    schemaVersion: 1,
    name: "select",
    namespace: null,
    type: "component",
    frameworks: ["react", "web-components"],
    stability: "stable",
    behaviorOwner: "web-components",
    version: "1.0.0",
    dependencies: {},
    peerDependencies: { react: "^18.2.0 || ^19.0.0" },
    registryDependencies: [],
    files: [
      {
        path: "src/components/select/select.tsx",
        type: "registry:ui",
        checksum: `sha256-${"a".repeat(64)}`,
      },
    ],
    cssVariables: ["--sk-color-primary"],
    localesCovered: ["en-US"],
    license: "MIT",
    ai: {
      summary: "Choose one or more options from a list.",
      whenToUse: ["Picking 2–20 known options"],
      whenNotToUse: ["Free-text input is valid — use a Combobox"],
      accessibility: "Listbox pattern.",
      example: "<Select />",
      localesCovered: ["en-US"],
      knownLimitations: ["SSR consumers must pass an explicit id"],
    },
  }
}

describe("validateRegistryItem", () => {
  it("accepts a well-formed entry", () => {
    const result = validateRegistryItem(validItem())
    expect(result.ok).toBe(true)
  })

  it("rejects a non-object", () => {
    for (const input of [null, 42, "select", [], undefined]) {
      expect(validateRegistryItem(input).ok).toBe(false)
    }
  })

  it("rejects an unknown schemaVersion", () => {
    const result = validateRegistryItem({ ...validItem(), schemaVersion: 2 })
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/schemaVersion")
  })

  it("rejects an unknown stability label", () => {
    const result = validateRegistryItem({ ...validItem(), stability: "beta" })
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/stability")
  })

  it("rejects an empty frameworks list", () => {
    const result = validateRegistryItem({ ...validItem(), frameworks: [] })
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/frameworks")
  })

  it("rejects a cssVariables entry outside the --sk- namespace", () => {
    const result = validateRegistryItem({ ...validItem(), cssVariables: ["--blue-500"] })
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/cssVariables/0")
  })

  it("rejects a malformed checksum", () => {
    const item = validItem()
    item.files[0]!.checksum = "md5-deadbeef"
    const result = validateRegistryItem(item)
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/files/0/checksum")
  })

  it("rejects a file entry with no checksum at all", () => {
    const result = validateRegistryItem({
      ...validItem(),
      files: [{ path: "a.tsx", type: "registry:ui" }],
    })
    expect(result.ok).toBe(false)
  })

  it("rejects an entry with no files", () => {
    const result = validateRegistryItem({ ...validItem(), files: [] })
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/files")
  })

  it("rejects an over-long ai.summary", () => {
    const item = validItem()
    item.ai.summary = "x".repeat(201)
    const result = validateRegistryItem(item)
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/ai/summary")
  })

  it("rejects an ai block with empty whenNotToUse", () => {
    const item = validItem()
    item.ai.whenNotToUse = []
    const result = validateRegistryItem(item)
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/ai/whenNotToUse")
  })

  it("rejects a stable component whose whenNotToUse names no alternative", () => {
    const item = validItem()
    item.ai.whenNotToUse = ["It has options"]
    const result = validateRegistryItem(item)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors[0]?.pointer).toBe("/ai/whenNotToUse")
  })

  it("allows a preview component to skip the alternative rule", () => {
    const item = validItem()
    item.stability = "preview"
    item.ai.whenNotToUse = ["It has options"]
    expect(validateRegistryItem(item).ok).toBe(true)
  })

  it("rejects unknown top-level properties", () => {
    const result = validateRegistryItem({ ...validItem(), scripts: ["rm -rf /"] })
    expect(result.ok).toBe(false)
  })

  it("collects every error rather than stopping at the first", () => {
    const result = validateRegistryItem({
      schemaVersion: 3,
      name: "Select!",
      stability: "beta",
      ai: {},
    })
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors.length).toBeGreaterThan(3)
  })
})
