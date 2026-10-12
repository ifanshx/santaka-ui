import type { ComponentSummary, RegistryItem } from "./types.js"

/**
 * Registry query surface shared by the CLI and the MCP server
 * (section 11). Both read the same validated items; neither reaches the
 * network, and neither ever loads an item without validating it first.
 */
export type RegistryIndex = {
  items: RegistryItem[]
}

function toSummary(item: RegistryItem): ComponentSummary {
  return {
    name: item.name,
    stability: item.stability,
    behaviorOwner: item.behaviorOwner,
    summary: item.ai.summary,
    whenToUse: item.ai.whenToUse,
    whenNotToUse: item.ai.whenNotToUse,
    accessibility: item.ai.accessibility,
    frameworks: item.frameworks,
    localesCovered: item.localesCovered,
    knownLimitations: item.ai.knownLimitations,
  }
}

const STABILITY_ORDER: Record<RegistryItem["stability"], number> = {
  stable: 0,
  preview: 1,
  experimental: 2,
  deprecated: 3,
}

/**
 * Rank components for a need. Purely local: substring and tag matching over
 * `summary`, `whenToUse`, and the component name. Stable always sorts ahead of
 * Preview, ahead of Experimental (section 11, MCP server), so a query never
 * silently steers work onto an unstable surface.
 */
export function searchComponents(
  index: RegistryIndex,
  need: string,
  constraints: { framework?: string; interactive?: boolean; formAssociated?: boolean } = {},
): ComponentSummary[] {
  const terms = need
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1)

  return index.items
    .filter(
      (item) => !constraints.framework || item.frameworks.includes(constraints.framework as never),
    )
    .map((item) => {
      const summary = toSummary(item)
      const haystacks = [item.name, summary.summary, ...summary.whenToUse].map((entry) =>
        entry.toLowerCase(),
      )
      const score = terms.reduce((total, term) => {
        if (haystacks.some((entry) => entry === term)) return total + 10
        if (haystacks.some((entry) => entry.includes(term))) return total + 4
        return total
      }, 0)
      return { summary, score, stability: STABILITY_ORDER[item.stability] }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => a.stability - b.stability || b.score - a.score)
    .map((candidate) => candidate.summary)
}

export function getComponent(
  index: RegistryIndex,
  name: string,
  framework?: string,
): RegistryItem | undefined {
  return index.items.find(
    (item) => item.name === name && (!framework || item.frameworks.includes(framework as never)),
  )
}

export { toSummary }
