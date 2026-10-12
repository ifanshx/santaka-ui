/**
 * Component and registry metadata types (section 9, Component metadata schema).
 *
 * These mirror `schema/registry-item-v1.json`. The JSON Schema is the contract
 * for third-party registries; these types are the contract for TypeScript
 * consumers inside this monorepo.
 */

export const REGISTRY_ITEM_TYPES = ["component", "block", "theme", "utility"] as const
export type RegistryItemType = (typeof REGISTRY_ITEM_TYPES)[number]

export const STABILITY_LABELS = ["stable", "preview", "experimental", "deprecated"] as const
export type Stability = (typeof STABILITY_LABELS)[number]

export const FRAMEWORK_TARGETS = ["react", "vue", "svelte", "angular", "web-components"] as const
export type FrameworkTarget = (typeof FRAMEWORK_TARGETS)[number]

/** The AI-facing block required on every component before it can be Stable. */
export type AiMetadata = {
  summary: string
  whenToUse: string[]
  whenNotToUse: string[]
  accessibility: string
  example: string
  localesCovered: string[]
  knownLimitations: string[]
}

export type RegistryFile = {
  path: string
  type: string
  checksum: string
}

export type RegistryItem = {
  $schema?: string
  schemaVersion: 1
  name: string
  namespace: string | null
  type: RegistryItemType
  frameworks: FrameworkTarget[]
  stability: Stability
  behaviorOwner: "web-components" | "react" | "framework-neutral"
  version: string
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
  registryDependencies: string[]
  files: RegistryFile[]
  cssVariables: string[]
  localesCovered: string[]
  license: string
  ai: AiMetadata
}

/** Runtime shape used by the MCP server, which has no DOM dependency. */
export type ComponentSummary = {
  name: string
  stability: Stability
  behaviorOwner: RegistryItem["behaviorOwner"]
  summary: string
  whenToUse: string[]
  whenNotToUse: string[]
  accessibility: string
  frameworks: FrameworkTarget[]
  localesCovered: string[]
  knownLimitations: string[]
}
