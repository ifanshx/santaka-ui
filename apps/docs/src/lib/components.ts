/**
 * The component catalogue, read from the registry (ADR-006).
 *
 * This module is the whole point of the decision: **component pages are not
 * written, they are derived.** One `RegistryItem` feeds the CLI, the MCP server,
 * `llms.txt`, and this site. A prop renamed in a component shows up in all four
 * or in none, which is the drift the registry exists to prevent. A hand-written
 * component page would be a fifth, unaudited copy of `props`, `events`, and
 * `knownLimitations`.
 *
 * Nothing here fetches. The registry index is a file this workspace builds.
 */
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import type { RegistryIndex, RegistryItem } from "@santaka-ui/core"

const require = createRequire(import.meta.url)

/** One prop, as the registry declares it. */
export type Prop = {
  name: string
  type: string
  default: string | null
  description: string
}

export type ComponentPage = {
  name: string
  tag: string
  stability: string
  frameworks: string[]
  behaviorOwner: string
  version: string
  locales: string[]
  summary: string
  whenToUse: string[]
  whenNotToUse: string[]
  accessibility: string
  example: string
  limitations: string[]
  props: Prop[]
  events: string[]
  cssVariables: string[]
  /** The registry `type`, so a future block or theme reads correctly. */
  type: string
}

/** Stable before Preview before Experimental before Deprecated. */
const STABILITY_ORDER = { stable: 0, preview: 1, experimental: 2, deprecated: 3 } as const

type Stability = keyof typeof STABILITY_ORDER

function loadIndex(): RegistryIndex {
  return JSON.parse(
    require.resolve ? readFileSync(require.resolve("@santaka-ui/core/registry"), "utf8") : "{}",
  ) as RegistryIndex
}

/**
 * Every component page, ordered Stable-first so a reader never starts on an
 * unstable surface — the same ordering `search_components` uses (§11).
 *
 * Components only: a block has no `sk-*` tag, so mapping one to a component page
 * would put a tag on a page for an element that does not exist (ADR-022).
 */
export function componentPages(): ComponentPage[] {
  return pagesOfType("component")
    .map((item: RegistryItem) => ({
      name: item.name,
      tag: `sk-${item.name}`,
      stability: item.stability,
      frameworks: item.frameworks ?? [],
      behaviorOwner: item.behaviorOwner,
      version: item.version,
      locales: item.localesCovered ?? [],
      summary: item.ai.summary,
      whenToUse: item.ai.whenToUse ?? [],
      whenNotToUse: item.ai.whenNotToUse ?? [],
      accessibility: item.ai.accessibility,
      example: item.ai.example,
      limitations: item.ai.knownLimitations ?? [],
      props: item.props ?? [],
      events: item.events ?? [],
      cssVariables: item.cssVariables ?? [],
      type: item.type,
    }))
    .sort(byStabilityThenName)
}

/** A block page: markup that composes components, and the components it names. */
export type BlockPage = {
  name: string
  stability: string
  frameworks: string[]
  version: string
  locales: string[]
  summary: string
  whenToUse: string[]
  whenNotToUse: string[]
  accessibility: string
  example: string
  limitations: string[]
  cssVariables: string[]
  /**
   * The registry entries this block composes, from the entry's own
   * `registryDependencies` — the same list `santaka add` installs (ADR-022).
   */
  composes: string[]
  /** File paths as the registry declares them, for the "what you get" list. */
  files: string[]
}

/** Every block page, in the same order the component catalogue uses. */
export function blockPages(): BlockPage[] {
  return pagesOfType("block")
    .map((item: RegistryItem) => ({
      name: item.name,
      stability: item.stability,
      frameworks: item.frameworks ?? [],
      version: item.version,
      locales: item.localesCovered ?? [],
      summary: item.ai.summary,
      whenToUse: item.ai.whenToUse ?? [],
      whenNotToUse: item.ai.whenNotToUse ?? [],
      accessibility: item.ai.accessibility,
      example: item.ai.example,
      limitations: item.ai.knownLimitations ?? [],
      cssVariables: item.cssVariables ?? [],
      composes: item.registryDependencies ?? [],
      files: (item.files ?? []).map((file) => file.path),
    }))
    .sort(byStabilityThenName)
}

function pagesOfType(type: string): RegistryItem[] {
  return (loadIndex().items ?? []).filter((item: RegistryItem) => item.type === type)
}

function byStabilityThenName(
  a: { stability: string; name: string },
  b: { stability: string; name: string },
) {
  return (
    (STABILITY_ORDER[a.stability as Stability] ?? 9) -
      (STABILITY_ORDER[b.stability as Stability] ?? 9) || a.name.localeCompare(b.name)
  )
}

/** The stability labels in use, so the index can group by them. */
export function stabilityGroups(): Array<{ label: string; pages: ComponentPage[] }> {
  const pages = componentPages()
  const labels = [...new Set(pages.map((page) => page.stability))].sort(
    (a: string, b: string) =>
      (STABILITY_ORDER[a as Stability] ?? 9) - (STABILITY_ORDER[b as Stability] ?? 9),
  )
  return labels.map((label) => ({
    label,
    pages: pages.filter((page) => page.stability === label),
  }))
}

/**
 * §10 requires separate Stable / Preview / Experimental / Deprecated labels.
 * They are read from `RegistryItem.stability`, not written by an author.
 */
export function stabilityOf(page: ComponentPage): string {
  return page.stability
}
