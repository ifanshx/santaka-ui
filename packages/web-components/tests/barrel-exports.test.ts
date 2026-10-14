import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/**
 * Barrel export contract (the guard the sk-select bug bought).
 *
 * `sk-select` shipped complete — component, styles, registry entry, tests —
 * and never registered in a browser, because `SkSelect` was missing from
 * `src/index.ts` and Stencil's `customElementsExportBehavior` derives
 * `customElements.define()` from the exports. Every test passed: the registry
 * validated the source files, the e2e suite asserted against its own fixture,
 * and nothing connected the COMPONENTS list to the barrel.
 *
 * The rule this enforces: **every component directory must be exported from
 * the barrel**, because the barrel is what turns a class into a registered
 * custom element in the documented eager path. A component that is not
 * exported is dead code that looks alive.
 */
const here = dirname(fileURLToPath(import.meta.url))
// tests/ -> web-components root: up from tests/ into the package.
const wcRoot = resolve(here, "..")
const componentsDir = join(wcRoot, "src", "components")
const barrelPath = join(wcRoot, "src", "index.ts")

const barrel = readFileSync(barrelPath, "utf8")

const directories = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.startsWith("sk-"))
  .sort()

/** `sk-checkbox` -> `SkCheckbox`. */
const classNameFor = (tag: string) =>
  "Sk" +
  tag
    .slice(3)
    .split("-")
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("")

describe("barrel export contract", () => {
  it("exports every component directory from the barrel", () => {
    for (const tag of directories) {
      const className = classNameFor(tag)
      expect(
        barrel,
        `${tag} has a component directory but ${className} is not exported from src/index.ts — with customElementsExportBehavior, the missing export means the element never registers in the eager path`,
      ).toMatch(new RegExp(`export \\{ ${className} \\} from "\\./components/${tag}/${tag}\\.js"`))
    }
  })

  it("lists every component in the COMPONENTS array", () => {
    for (const tag of directories) {
      expect(barrel, `${tag} has a component directory but is not in the COMPONENTS array`).toMatch(
        new RegExp(`"${tag}"`),
      )
    }
  })

  it("declares no component in COMPONENTS that has no directory", () => {
    // The other direction: a COMPONENTS entry without a directory is a
    // component that was renamed or deleted and left a ghost behind.
    // Compound parts (`sk-tab`, `sk-tab-panel`) live beside their parent
    // (`sk-tabs`) and are legitimately listed without their own directory.
    const compoundParts = new Set(["sk-tab", "sk-tab-panel"])
    for (const tag of [...barrel.matchAll(/"(sk-[a-z-]+)"/g)].map((m) => m[1])) {
      if (compoundParts.has(tag)) continue
      expect(
        directories,
        `COMPONENTS lists "${tag}" but src/components/${tag}/ does not exist`,
      ).toContain(tag)
    }
  })

  it("has a registry entry for every component directory", () => {
    const registryDir = resolve(wcRoot, "..", "core", "registry")
    for (const tag of directories) {
      const entryPath = join(registryDir, `${tag.slice(3)}.json`)
      expect(
        existsSync(entryPath),
        `${tag} has no registry entry at packages/core/registry/${tag.slice(3)}.json — run the core build to generate it`,
      ).toBe(true)
    }
  })
})
