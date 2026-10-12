/**
 * Emit the published JSON Schema from the TypeScript source of truth.
 *
 * `src/registry-item-schema.ts` is the single definition; this writes the
 * file that third-party registries and editors validate against. A test
 * asserts the two never drift.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(here, "..", "schema", "registry-item-v1.json")

const { registryItemSchema } = await import("../dist/registry-item-schema.js")

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, `${JSON.stringify(registryItemSchema, null, 2)}\n`)
console.log(`[core] wrote ${outFile}`)
