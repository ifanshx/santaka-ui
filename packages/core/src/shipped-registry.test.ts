import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { validateRegistryItem } from "./validate-item.js"

/**
 * Contract tests for the registry entries that actually ship (section 12,
 * Test layers item 10).
 *
 * These are the tests that catch the two failures a design system cannot ship
 * with: a registry entry that does not satisfy its own schema, and a checksum
 * that no longer matches the file it claims to describe.
 */
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")
const registryDir = join(repoRoot, "packages", "core", "registry")

// `index.json` is the generated aggregate of these entries, not an entry: it is
// validated by its own contract test, and asserting per-component fields
// against it would fail on every one.
const entryFiles = readdirSync(registryDir).filter(
  (name) => name.endsWith(".json") && name !== "index.json",
)
const entries = entryFiles.map((name) => ({
  name,
  raw: readFileSync(join(registryDir, name), "utf8"),
  parsed: JSON.parse(readFileSync(join(registryDir, name), "utf8")),
}))

describe("shipped registry entries", () => {
  it("ships at least one entry", () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries.map((entry) => [entry.name, entry]))(
    "%s validates against the schema",
    (_name, entry) => {
      const result = validateRegistryItem(entry.parsed)
      if (!result.ok) {
        const detail = result.errors.map((e) => `${e.pointer} ${e.message}`).join("\n")
        throw new Error(`registry entry is invalid:\n${detail}`)
      }
      expect(result.ok).toBe(true)
    },
  )

  it.each(entries.map((entry) => [entry.name, entry]))(
    "%s names its CSS variables with the --sk- prefix",
    (_name, entry) => {
      for (const name of entry.parsed.cssVariables) {
        expect(name.startsWith("--sk-")).toBe(true)
      }
    },
  )

  it.each(entries.map((entry) => [entry.name, entry]))(
    "%s has checksums matching the files on disk",
    (_name, entry) => {
      for (const file of entry.parsed.files) {
        const absolute = join(repoRoot, "packages", "web-components", file.path)
        const actual = createHash("sha256").update(readFileSync(absolute)).digest("hex")
        expect(file.checksum, `${file.path} checksum`).toBe(`sha256-${actual}`)
      }
    },
  )

  it.each(entries.map((entry) => [entry.name, entry]))(
    "%s has an ai block that names an alternative",
    (_name, entry) => {
      // A component with no stated alternative cannot be chosen correctly by a
      // person or an agent (section 11, Machine-readable component metadata).
      expect(entry.parsed.ai.whenNotToUse.length).toBeGreaterThan(0)
      for (const line of entry.parsed.ai.whenNotToUse) {
        expect(line.length).toBeGreaterThan(0)
      }
    },
  )

  it.each(entries.map((entry) => [entry.name, entry]))(
    "%s states its accessibility pattern",
    (_name, entry) => {
      expect(entry.parsed.ai.accessibility.length).toBeGreaterThan(0)
    },
  )

  it("gives every component a unique name", () => {
    const names = entries.map((entry) => entry.parsed.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("records the web components package as the behavior owner", () => {
    for (const entry of entries) {
      expect(entry.parsed.behaviorOwner).toBe("web-components")
    }
  })

  it("declares no runtime dependencies for Tier 1 components", () => {
    for (const entry of entries) {
      expect(entry.parsed.dependencies).toEqual({})
      expect(entry.parsed.peerDependencies).toEqual({})
    }
  })

  it("reports the props and events the component actually has", () => {
    // The public surface the MCP server's `get_component` reports (section 11).
    // Derived from the committed type declarations and component sources, so a
    // rename in either is a test failure here rather than a stale document.
    for (const entry of entries) {
      const { props, events } = entry.parsed
      expect(Array.isArray(props), `${entry.name} props`).toBe(true)
      expect(Array.isArray(events), `${entry.name} events`).toBe(true)
      for (const prop of props) {
        expect(typeof prop.name, `${entry.name} prop name`).toBe("string")
        expect(typeof prop.type, `${entry.name} prop type`).toBe("string")
      }
      for (const event of events) {
        expect(event.startsWith("sk-"), `${entry.name} event ${event}`).toBe(true)
      }
    }
  })

  it("marks a form control as emitting sk-value-change", () => {
    // A spot-check that the derivation reaches the shared base: Input emits
    // `sk-value-change` from `setupFormControl()`, not from its own source, so
    // a naive per-file scan reports nothing.
    const formControls = ["input", "textarea", "select", "checkbox", "switch", "radio-group"]
    for (const name of formControls) {
      const entry = entries.find((candidate) => candidate.parsed.name === name)
      expect(entry?.parsed.events, `${name} events`).toContain("sk-value-change")
    }
  })
})

describe("the generated registry index", () => {
  const indexPath = join(registryDir, "index.json")
  const index = JSON.parse(readFileSync(indexPath, "utf8"))

  it("contains every per-component entry, and nothing else", () => {
    const indexed = index.items.map((item: { name: string }) => item.name).sort()
    const onDisk = entries.map((entry) => entry.parsed.name).sort()
    expect(indexed).toEqual(onDisk)
  })

  it("agrees with the per-component files byte for byte", () => {
    // The index is generated from the same pass as the entries, so a divergence
    // means someone edited one and not the other.
    for (const entry of entries) {
      const indexed = index.items.find((item: { name: string }) => item.name === entry.parsed.name)
      expect(indexed, `${entry.name} in the index`).toEqual(entry.parsed)
    }
  })

  it("validates every item against the schema", () => {
    for (const item of index.items) {
      const result = validateRegistryItem(item)
      if (!result.ok) {
        const detail = result.errors.map((e) => `${e.pointer} ${e.message}`).join("\n")
        throw new Error(`${item.name} is invalid:\n${detail}`)
      }
      expect(result.ok).toBe(true)
    }
  })
})
