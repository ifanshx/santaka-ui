/**
 * Package entrypoint.
 *
 * The command implementations are exported so a consumer can script them — a
 * monorepo adding a component to twelve packages should not shell out twelve
 * times — and so the tests exercise the same functions the bin runs.
 */
export {
  add,
  diff,
  doctor,
  EXIT,
  init,
  list,
  loadRegistry,
  registryAdd,
  themeInit,
  update,
} from "./commands.js"
export type { AddOptions, CommandContext, CommandResult, InitOptions } from "./commands.js"
export { detectProject, resolveFramework, SUPPORTED_FRAMEWORKS, isFramework } from "./detect.js"
export type { Detection, Framework, PackageManager } from "./detect.js"
export { applyWrites, checksumOf, resolveInside } from "./fs-safe.js"
export type { PathSafetyResult, WritePlanEntry, WriteResult } from "./fs-safe.js"
export {
  compareFiles,
  conflictsOf,
  emptyManifest,
  MANIFEST_FILENAME,
  manifestPath,
  readManifest,
  writeManifest,
} from "./manifest.js"
export type { FileComparison, Manifest, ManifestItem } from "./manifest.js"
export { renderDiff, diffLines } from "./diff.js"
export {
  componentSourceDir,
  fetchRemoteRegistry,
  findItem,
  loadBundledRegistry,
  readRegistryConfig,
  resolveClosure,
  resolveItemFiles,
  typeCounts,
  writeRegistryConfig,
} from "./registry.js"
export type {
  ClosureResult,
  LoadedRegistry,
  MissingDependency,
  RegistrySource,
  ResolvedFile,
} from "./registry.js"
