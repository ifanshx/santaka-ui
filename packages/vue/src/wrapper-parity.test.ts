import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import * as vue from "./index.js"

/**
 * Every component the universal package ships must have a Vue wrapper, and no
 * wrapper may exist for a component that does not.
 *
 * This test exists because the two halves can drift silently: seven components —
 * breadcrumb, combobox, drawer, pagination, popover, slider, taka — shipped with a
 * React wrapper, a Storybook story, registry entries, and browser tests, but no Vue
 * adapter at all, and nothing failed. `@santaka-ui/vue` is documented Stable, so a
 * consumer reading the support matrix had no way to learn they were missing.
 *
 * The check is derived, not written: it reads the component directories out of the
 * universal package and compares them against both adapters' export maps, so adding
 * a component makes this fail until both adapters wrap it.
 */
const PKG = resolve(__dirname)
const REPO = resolve(PKG, "../../..")

/** `<sk-breadcrumb>` -> `Breadcrumb`, matching both packages' export naming. */
const exportName = (tag: string): string =>
  tag
    .replace(/^sk-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

const componentTags = (): string[] =>
  readdirSync(resolve(REPO, "packages/web-components/src/components"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "shared")
    .map((entry) => entry.name)
    .sort()

// Components whose Vue wrapper intentionally has a different export name, or which
// ship as a set of subcomponents rather than one wrapper.
const NAME_OVERRIDES: Record<string, string> = {
  "sk-accordion-item": "Accordion",
  "sk-tab": "Tabs",
  "sk-tab-panel": "Tabs",
}

describe("Vue adapter covers every shipped component", () => {
  const tags = componentTags()

  it("finds the component directories it is guarding", () => {
    // A check that cannot fail asserts nothing: if the directory read breaks, this
    // suite would pass vacuously for every component below.
    expect(tags.length).toBeGreaterThanOrEqual(38)
    expect(tags).toContain("sk-button")
  })

  it.each(tags)("%s has a Vue wrapper", (tag) => {
    const name = NAME_OVERRIDES[tag] ?? exportName(tag)
    expect(Object.keys(vue), `${tag} -> ${name} is missing from @santaka-ui/vue`).toContain(name)
  })

  it("exports no wrapper for a component that does not ship", () => {
    const known = new Set(tags.map((tag) => NAME_OVERRIDES[tag] ?? exportName(tag)))
    // Non-component exports: helpers, theme, and the slot-carrying subcomponents.
    const notComponents = new Set([
      "ThemeScript",
      "useTheme",
      "THEME_STORAGE_KEY",
      "THEME_INIT_SCRIPT",
      "DialogTrigger",
      "DialogContent",
      "AlertDialogContent",
      "TooltipTrigger",
      "TabsList",
      "Tab",
      "TabPanel",
      "AccordionItem",
      "DotBadge",
      "AvatarGroup",
    ])
    const exported = Object.keys(vue).filter((key) => /^[A-Z]/.test(key))
    const orphans = exported.filter((name) => !known.has(name) && !notComponents.has(name))
    expect(orphans, `exported but no such component ships: ${orphans.join(", ")}`).toEqual([])
  })
})

describe("Vue and React adapters expose the same component surface", () => {
  it("names every React component in Vue too", () => {
    // Parsed from source rather than imported: `@santaka-ui/react` is a peer of
    // this package, and importing it here would make a Vue test depend on React.
    const reactIndex = readFileSync(resolve(REPO, "packages/react/src/index.ts"), "utf8")
    const reactComponents = [
      // Value exports only — `export type { … }` lines carry the prop and element
      // types, which are not components and need not match by name.
      ...reactIndex.matchAll(/^export \{ ([^}]+) \} from/gm),
    ]
      .flatMap((match) => (match[1] ?? "").split(",").map((name) => name.trim()))
      .filter((name) => /^[A-Z]/.test(name))
      .sort()
    const vueExports = Object.keys(vue)

    expect(reactComponents.length).toBeGreaterThanOrEqual(38)
    const missing = reactComponents.filter((name) => !vueExports.includes(name))
    expect(missing, `in @santaka-ui/react but not @santaka-ui/vue: ${missing.join(", ")}`).toEqual(
      [],
    )
  })
})
