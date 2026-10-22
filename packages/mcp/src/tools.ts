/**
 * The four MCP tools (docs/ARCHITECTURE.md §11).
 *
 * Each is a pure function over the registry data: no model, no network, no
 * filesystem beyond the metadata loaded at startup. That is the whole point of
 * the server — it is a deterministic query surface, so an agent asking "what
 * should I use for a delete confirmation" gets the same answer every time, from
 * the same metadata the docs and the CLI read.
 *
 * The tools are separate from the transport on purpose: `server.ts` wires them
 * to the MCP SDK, and the tests call them directly. A tool that only works when
 * a stdio client is attached is a tool nobody can unit-test.
 */
import { searchComponents, type ComponentSummary } from "@santaka-ui/core"
import type { RegistryFile, RegistryItemType } from "@santaka-ui/core"
import {
  loadRegistry,
  loadTokens,
  type RegistryIndexFile,
  type Token,
  type TokenTheme,
} from "./data.js"

const STABILITY_ORDER = { stable: 0, preview: 1, experimental: 2, deprecated: 3 } as const

export type Framework = "react" | "vue" | "svelte" | "angular" | "web-components"

export type SearchInput = {
  need: string
  constraints?: {
    framework?: Framework
    interactive?: boolean
    formAssociated?: boolean
  }
}

export type SearchResult = {
  components: Array<
    ComponentSummary & {
      type: RegistryItemType
      /**
       * The custom element tag. Present only for `type: "component"` — a
       * block composes components and has no tag of its own, so emitting
       * `sk-<name>` for one would name an element no package registers.
       */
      tag?: string
      /** Names another `add` must resolve first; a block's composed components. */
      registryDependencies: string[]
    }
  >
  /** How many items were considered, so an empty result is legible. */
  considered: number
}

/**
 * Rank registry items for a need.
 *
 * `@santaka-ui/core`'s `searchComponents` does the scoring and the
 * stable-before-preview ordering (it is the same function the CLI uses, so the
 * two cannot disagree). This adds the two filters the plan names that the core
 * function does not implement — `interactive` and `formAssociated` — because
 * those are facts about the item, and the core function is deliberately
 * generic over a registry that may hold non-components.
 *
 * `interactive` and `formAssociated` are derived from the item's own
 * metadata rather than a hand-kept list: a form-associated component is one
 * that declares `sk-value-change` (every FACE control does), and an interactive
 * one is one that has any event or a focusable role. A block has neither
 * events nor props, so it is asserted non-interactive by the same derivation
 * rather than by a type special case. A hardcoded list would silently stop
 * covering a new item.
 */
export function searchComponentsTool(
  registry: RegistryIndexFile,
  input: SearchInput,
): SearchResult {
  const constraints = input.constraints ?? {}

  const eligible = registry.items.filter((item) => {
    if (constraints.framework && !item.frameworks.includes(constraints.framework)) return false
    if (constraints.formAssociated !== undefined) {
      const isFormAssociated = item.events?.includes("sk-value-change") ?? false
      if (isFormAssociated !== constraints.formAssociated) return false
    }
    if (constraints.interactive !== undefined) {
      const isInteractive = isInteractiveComponent(item)
      if (isInteractive !== constraints.interactive) return false
    }
    return true
  })

  // The core function takes an index; give it only the eligible items so a
  // filter cannot be undone by a higher-scoring excluded component.
  const ranked = searchComponents(
    { items: eligible },
    input.need,
    constraints.framework ? { framework: constraints.framework } : {},
  )

  // Only a component has a custom element; a block's name *is* its identifier.
  const tagByName = new Map(
    eligible
      .filter((item) => item.type === "component")
      .map((item) => [item.name, `sk-${item.name}`] as const),
  )
  const dependenciesByName = new Map(eligible.map((item) => [item.name, item.registryDependencies]))
  const typeByName = new Map(eligible.map((item) => [item.name, item.type]))
  const components = ranked.map((summary) => {
    const tag = tagByName.get(summary.name)
    return {
      ...summary,
      type: typeByName.get(summary.name) ?? "component",
      // A spread of a conditional property: present only for a component.
      ...(tag !== undefined && { tag }),
      registryDependencies: dependenciesByName.get(summary.name) ?? [],
    }
  })

  return { components, considered: eligible.length }
}

/**
 * A component is interactive when it does something in response to the user:
 * it dispatches an event, or it is a control the user focuses. Derived from the
 * metadata, not from a list.
 */
function isInteractiveComponent(item: RegistryIndexFile["items"][number]): boolean {
  if ((item.events?.length ?? 0) > 0) return true
  // Form controls that submit without dispatching a change event are still
  // interactive; so is anything with an `open` prop (an overlay).
  const propNames = new Set((item.props ?? []).map((prop) => prop.name))
  return (
    propNames.has("open") ||
    propNames.has("value") ||
    propNames.has("checked") ||
    propNames.has("disabled") ||
    propNames.has("loading")
  )
}

export type GetComponentInput = {
  name: string
  framework?: Framework
}

export type GetComponentResult =
  | { found: true; component: ComponentDetail }
  | { found: false; error: string; suggestions: string[] }

export type ComponentDetail = {
  name: string
  type: RegistryItemType
  /**
   * The custom element tag. Present only for `type: "component"` — a block is
   * composed of elements and has no tag of its own.
   */
  tag?: string
  stability: string
  frameworks: string[]
  behaviorOwner: string
  summary: string
  whenToUse: string[]
  whenNotToUse: string[]
  accessibility: string
  example: string
  knownLimitations: string[]
  /** A block composes components instead of declaring props; empty for one. */
  props: Array<{ name: string; type: string; default: string | null; description: string }>
  events: string[]
  /** The components a block composes, which the consumer must add first. */
  registryDependencies: string[]
  /** The block's or component's own source files, with their checksums. */
  files: RegistryFile[]
  cssVariables: string[]
}

/**
 * The full record for one item.
 *
 * A miss is not an error in the MCP sense — the agent asked a question and the
 * honest answer is "no such entry" — so it returns `found: false` with
 * near-name suggestions rather than throwing. An agent that gets a bare error
 * retries the same wrong name.
 *
 * The `tag` field is present only for a component: a block composes `sk-*`
 * elements and is identifier-addressed by its name alone, so emitting a tag
 * for one would name an element no package registers. `props` and `events`
 * stay empty for a block — the entry's `registryDependencies` and `files` are
 * what an `add` of it needs.
 */
export function getComponentTool(
  registry: RegistryIndexFile,
  input: GetComponentInput,
): GetComponentResult {
  const name = input.name.trim().replace(/^sk-/, "").toLowerCase()
  const matches = registry.items.filter((candidate) => candidate.name === name)
  const framework = input.framework
  const item =
    framework !== undefined
      ? matches.find((candidate) => candidate.frameworks.includes(framework))
      : matches[0]

  if (!item) {
    return {
      found: false,
      error: `No component named "${input.name}".`,
      suggestions: suggestNames(
        name,
        registry.items.map((candidate) => candidate.name),
      ),
    }
  }

  const isComponent = item.type === "component"
  return {
    found: true,
    component: {
      name: item.name,
      type: item.type,
      // A block composes elements and is addressed by its name — no tag.
      ...(isComponent && { tag: `sk-${item.name}` }),
      stability: item.stability,
      frameworks: item.frameworks,
      behaviorOwner: item.behaviorOwner,
      summary: item.ai.summary,
      whenToUse: item.ai.whenToUse,
      whenNotToUse: item.ai.whenNotToUse,
      accessibility: item.ai.accessibility,
      example: item.ai.example,
      knownLimitations: item.ai.knownLimitations,
      props: item.props ?? [],
      events: item.events ?? [],
      registryDependencies: item.registryDependencies,
      files: item.files,
      cssVariables: item.cssVariables,
    },
  }
}

/** Names within a small edit distance, so a typo gets a real answer. */
function suggestNames(name: string, candidates: string[]): string[] {
  // Levenshtein, written with an explicit `?? 0` on every read because
  // `noUncheckedIndexedAccess` is on: the indices are always in range, but the
  // compiler cannot know that, and silencing it with a cast would hide a real
  // off-by-one if one ever appeared.
  const distance = (a: string, b: string): number => {
    const rows: number[][] = Array.from({ length: a.length + 1 }, () =>
      Array.from({ length: b.length + 1 }, () => 0),
    )
    for (let i = 0; i <= a.length; i++) rows[i]![0] = i
    for (let j = 0; j <= b.length; j++) rows[0]![j] = j
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        rows[i]![j] = Math.min(
          (rows[i - 1]?.[j] ?? 0) + 1,
          (rows[i]?.[j - 1] ?? 0) + 1,
          (rows[i - 1]?.[j - 1] ?? 0) + cost,
        )
      }
    }
    return rows[a.length]?.[b.length] ?? 0
  }

  return candidates
    .map((candidate) => ({ candidate, score: distance(name, candidate) }))
    .filter((entry) => entry.score <= 4)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((entry) => entry.candidate)
}

export type GetTokensInput = {
  theme: TokenTheme
  group?: string
}

export type GetTokensResult = {
  theme: TokenTheme
  total: number
  groups: Array<{ name: string; count: number }>
  tokens: Token[]
}

/**
 * Token values for a theme, optionally narrowed to one group.
 *
 * An unknown group is reported with the groups that exist rather than as an
 * empty list: "no tokens in group `colour`" is a worse answer than "did you
 * mean `color`", and the group names are right there.
 */
export function getTokensTool(registry: RegistryIndexFile, input: GetTokensInput): GetTokensResult {
  void registry
  const all = loadTokens(input.theme)
  const counts = new Map<string, number>()
  for (const token of all) counts.set(token.group, (counts.get(token.group) ?? 0) + 1)
  const groups = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const tokens = input.group ? all.filter((token) => token.group === input.group) : all
  return { theme: input.theme, total: tokens.length, groups, tokens }
}

export type GetUsageInput = {
  goal: string
  framework: Framework
}

export type GetUsageResult =
  | {
      found: true
      component: string
      type: RegistryItemType
      /** The custom element tag; present only for a component, never a block. */
      tag?: string
      install: string[]
      usage: string
      notes: string[]
      /** Names `add` must resolve first before the item's own files. */
      registryDependencies: string[]
    }
  | { found: false; error: string; suggestions: string[] }

/**
 * A copy-ready setup and usage snippet for the component that best matches a
 * goal.
 *
 * The install lines are the four imports a consumer actually needs (section 4's
 * distribution contract: tokens, styles, the element registration, and the
 * component CSS), which is the sequence the README gives and the one the
 * example page uses. React swaps the registration line for the adapter import.
 */
export function getUsageTool(registry: RegistryIndexFile, input: GetUsageInput): GetUsageResult {
  const { components } = searchComponentsTool(registry, {
    need: input.goal,
    constraints: { framework: input.framework },
  })
  const best = components[0]

  if (!best) {
    return {
      found: false,
      error: `No component matches "${input.goal}" for ${input.framework}.`,
      suggestions: [],
    }
  }

  const detail = getComponentTool(registry, { name: best.name })
  if (!detail.found) {
    return { found: false, error: detail.error, suggestions: detail.suggestions }
  }

  const install =
    input.framework === "react"
      ? [
          "pnpm add @santaka-ui/react @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles",
        ]
      : ["pnpm add @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles"]

  const imports =
    input.framework === "react"
      ? [
          'import "@santaka-ui/tokens/css"',
          'import "@santaka-ui/styles/index.css"',
          'import "@santaka-ui/react/styles.css"',
        ]
      : [
          'import "@santaka-ui/tokens/css"',
          'import "@santaka-ui/styles/index.css"',
          'import "@santaka-ui/web-components"',
          'import "@santaka-ui/web-components/santaka.css"',
        ]

  const isComponent = detail.component.type === "component"
  const tag = detail.component.tag
  return {
    found: true,
    component: detail.component.name,
    type: detail.component.type,
    // A block's usage is its markup, so the same field carries it; the tag
    // would name an element nothing registers.
    ...(tag !== undefined && { tag }),
    install: [...install, ...imports],
    usage: detail.component.example,
    notes: [
      detail.component.accessibility,
      ...detail.component.knownLimitations.map((limitation) => `Limitation: ${limitation}`),
    ],
    registryDependencies: isComponent ? [] : detail.component.registryDependencies,
  }
}

/** The tool surface, so `server.ts` and the tests describe it from one place. */
export const TOOLS = ["search_components", "get_component", "get_tokens", "get_usage"] as const
export type ToolName = (typeof TOOLS)[number]

export { loadRegistry, loadTokens, STABILITY_ORDER }
export type { RegistryIndexFile }
