export { registryItemSchema, REGISTRY_ITEM_SCHEMA_ID } from "./registry-item-schema.js"
export { validateRegistryItem } from "./validate-item.js"
export type { ValidationError, ValidationOutcome } from "./validate-item.js"
export { searchComponents, getComponent } from "./registry.js"
export type { RegistryIndex } from "./registry.js"
export { FRAMEWORK_TARGETS, REGISTRY_ITEM_TYPES, STABILITY_LABELS } from "./types.js"
export type {
  AiMetadata,
  ComponentSummary,
  FrameworkTarget,
  RegistryFile,
  RegistryItem,
  RegistryItemType,
  RegistryProp,
  Stability,
} from "./types.js"
