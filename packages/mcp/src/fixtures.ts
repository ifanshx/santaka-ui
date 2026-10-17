import type { RegistryItem } from "@santaka-ui/core"
import type { RegistryIndexFile } from "./data.js"

/**
 * Block-path fixtures.
 *
 * The bundled registry ships three blocks, but these factories generate entries
 * of both kinds anyway so a block assertion does not depend on a particular
 * shipped name or on those three entries staying shaped the way they are.
 */
export function makeComponent(name: string, overrides: Partial<RegistryItem> = {}): RegistryItem {
  return {
    schemaVersion: 1,
    name,
    namespace: null,
    type: "component",
    frameworks: ["web-components", "react"],
    stability: "stable",
    behaviorOwner: "web-components",
    version: "0.0.0",
    dependencies: {},
    peerDependencies: {},
    registryDependencies: [],
    files: [
      {
        path: `src/components/sk-${name}/sk-${name}.ts`,
        type: "registry:component",
        checksum: "sha256-000",
      },
    ],
    cssVariables: [],
    localesCovered: ["en"],
    license: "MIT",
    props: [{ name: "open", type: "boolean", default: "false", description: "Readies it." }],
    events: ["sk-open-change"],
    ai: {
      summary: `A ${name} component the fixture installs.`,
      whenToUse: [`when you need a ${name}`],
      whenNotToUse: ["use something else instead"],
      accessibility: "Keyboard reachable.",
      example: `<sk-${name}></sk-${name}>`,
      localesCovered: ["en"],
      knownLimitations: [],
    },
    ...overrides,
  }
}

/** A block: no tag, no props, no events; its markup composes components. */
export function makeBlock(overrides: Partial<RegistryItem> = {}): RegistryItem {
  return makeComponent("settings", {
    type: "block",
    behaviorOwner: "framework-neutral",
    files: [
      { path: "src/blocks/settings/settings.html", type: "registry:block", checksum: "sha256-001" },
      { path: "src/blocks/settings/settings.css", type: "registry:block", checksum: "sha256-002" },
    ],
    props: undefined,
    events: undefined,
    registryDependencies: ["button", "input"],
    ai: {
      summary: "A settings screen composed of form components.",
      whenToUse: ["when you need a full settings page"],
      whenNotToUse: ["use a single component instead"],
      accessibility: "Composed components are keyboard reachable.",
      example: "Import the block's markup; see its .html file.",
      localesCovered: ["en"],
      knownLimitations: [],
    },
    ...overrides,
  })
}

/** An index whose items may include blocks — the shape the tools read today. */
export function registryWithBlock(items: RegistryItem[]): RegistryIndexFile {
  return { schemaVersion: 1, generatedFrom: ["@santaka-ui/core"], items }
}
