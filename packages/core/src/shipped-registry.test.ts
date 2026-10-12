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

const entryFiles = readdirSync(registryDir).filter((name) => name.endsWith(".json"))
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
})
