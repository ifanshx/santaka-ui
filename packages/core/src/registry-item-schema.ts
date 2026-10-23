/**
 * Registry item JSON Schema, `registry-item-v1` (section 9, Component
 * metadata schema).
 *
 * This module is the single source of truth. `schema/registry-item-v1.json` is
 * generated from it and kept in sync by a test, so the published file and the
 * runtime validator can never disagree.
 *
 * `$schema` in emitted registry entries is an identifier string only. CI and
 * the CLI always validate against this local copy — never over the network.
 */
export const REGISTRY_ITEM_SCHEMA_ID = "https://santaka.my.id/schema/registry-item-v1.json"

const stringArray = { type: "array", items: { type: "string" } } as const

export const registryItemSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: REGISTRY_ITEM_SCHEMA_ID,
  title: "Santaka UI registry item",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "name",
    "namespace",
    "type",
    "frameworks",
    "stability",
    "behaviorOwner",
    "version",
    "dependencies",
    "peerDependencies",
    "registryDependencies",
    "files",
    "cssVariables",
    "localesCovered",
    "license",
    "ai",
  ],
  properties: {
    $schema: { type: "string" },
    schemaVersion: { const: 1 },
    name: { type: "string", minLength: 1, pattern: "^[a-z][a-z0-9-]*$" },
    namespace: { anyOf: [{ type: "null" }, { type: "string", minLength: 1 }] },
    type: { enum: ["component", "block", "theme", "utility"] },
    frameworks: {
      type: "array",
      minItems: 1,
      items: { enum: ["react", "vue", "svelte", "angular", "web-components"] },
    },
    stability: { enum: ["stable", "preview", "experimental", "deprecated"] },
    behaviorOwner: { enum: ["web-components", "react", "framework-neutral"] },
    version: { type: "string", minLength: 1 },
    dependencies: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    peerDependencies: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    registryDependencies: stringArray,
    files: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "type", "checksum"],
        properties: {
          path: { type: "string", minLength: 1 },
          type: { type: "string", minLength: 1 },
          checksum: { type: "string", pattern: "^sha256-[a-fA-F0-9]{64}$" },
        },
      },
    },
    cssVariables: {
      type: "array",
      items: { type: "string", pattern: "^--sk-" },
    },
    localesCovered: { ...stringArray, minItems: 1 },
    license: { type: "string", minLength: 1 },
    // The public surface, derived from the component's type declarations and
    // source. Optional because a future non-component entry (a block, a theme)
    // has no props, and requiring it would force an empty array that says
    // nothing.
    props: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type"],
        properties: {
          name: { type: "string", minLength: 1 },
          type: { type: "string", minLength: 1 },
          default: { anyOf: [{ type: "string" }, { type: "null" }] },
          description: { type: "string" },
        },
      },
    },
    events: {
      type: "array",
      items: { type: "string", pattern: "^sk-[a-z0-9-]+$" },
    },
    ai: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "whenToUse",
        "whenNotToUse",
        "accessibility",
        "example",
        "localesCovered",
        "knownLimitations",
      ],
      properties: {
        summary: { type: "string", minLength: 1, maxLength: 200 },
        whenToUse: { ...stringArray, minItems: 1 },
        whenNotToUse: { ...stringArray, minItems: 1 },
        accessibility: { type: "string", minLength: 1 },
        example: { type: "string", minLength: 1 },
        localesCovered: stringArray,
        knownLimitations: stringArray,
      },
    },
  },
} as const
