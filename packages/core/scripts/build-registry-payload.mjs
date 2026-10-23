/**
 * Build the published registry payload (ADR-007).
 *
 * A registry is **static versioned JSON**, not a live endpoint: the data changes
 * only when a component ships, and any URL serving these files is a registry.
 * This script writes the payload that the docs site serves and that
 * `santaka registry add <url>` reads.
 *
 * Three shapes are written, because one document cannot serve all consumers:
 *
 *   - `index.json`           — the current aggregate. What a CLI fetches.
 *   - `v<version>/index.json`— the same document, immutable, for a pinned consumer.
 *   - `<name>.json`          — one entry, so a scripted consumer can ask for one
 *                              component without the whole index.
 *
 * Every file is generated from `@santaka-ui/core/registry`, which is itself
 * generated and checksum-verified, so the published payload cannot drift from the
 * package that ships it.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { validateRegistryItem } from "@santaka-ui/core"

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")
const outRoot = join(repoRoot, "apps", "docs", "public", "registry")

/** @type {{ version: number, items: object[] }} */
const index = JSON.parse(readFileSync(require.resolve("@santaka-ui/core/registry"), "utf8"))

/** @type {string} */
const version = JSON.parse(
  readFileSync(join(repoRoot, "packages", "web-components", "package.json"), "utf8"),
).version

/**
 * Validate before publishing. The bundled entries are already validated by a
 * contract test, but the published payload is a different artifact and a
 * different promise: a consumer's CLI will trust it. Validating here is what
 * makes "generated from a validated source" true rather than assumed.
 */
const rejected = []
for (const item of index.items) {
  const outcome = validateRegistryItem(item)
  if (!outcome.ok) {
    rejected.push({
      name: item.name,
      errors: outcome.errors.map((error) => `${error.pointer} ${error.message}`),
    })
  }
}

if (rejected.length > 0) {
  for (const entry of rejected) {
    console.error(`[registry] ${entry.name}: ${entry.errors.join("; ")}`)
  }
  throw new Error(`[registry] refusing to publish ${rejected.length} invalid entry/entries`)
}

const document = {
  // The published document carries the schema it conforms to, so a consumer can
  // validate what it fetched without knowing this repository's conventions. It
  // was omitted, which left the published payload unvalidatable by design.
  $schema: index.$schema,
  version: 1,
  registryVersion: version,
  generatedAt: new Date().toISOString().slice(0, 10),
  items: index.items,
}

const write = (path, payload) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`)
}

// The current aggregate, and the immutable one for a pinned consumer.
write(join(outRoot, "index.json"), document)
write(join(outRoot, `v${version}`, "index.json"), document)

// One file per entry, at both addresses.
for (const item of index.items) {
  write(join(outRoot, `${item.name}.json`), item)
  write(join(outRoot, `v${version}`, `${item.name}.json`), item)
}

// The schemas, at the URL every entry's `$schema` already advertises.
//
// `$schema: "https://<host>/schema/registry-item-v1.json"` was a dead link: the
// schema files were written to `packages/core/schema/` and never copied into the
// published tree, so an editor or a third-party registry following that URL got
// a 404 whether or not the domain existed. Publishing them here is what makes
// the advertised address real.
const schemaRoot = join(repoRoot, "packages", "core", "schema")
const publicRoot = join(repoRoot, "apps", "docs", "public", "schema")
for (const file of ["registry-item-v1.json", "registry-index-v1.json"]) {
  mkdirSync(publicRoot, { recursive: true })
  writeFileSync(join(publicRoot, file), readFileSync(join(schemaRoot, file), "utf8"))
}

console.log(`[registry] wrote ${outRoot} (${index.items.length} items at v${version})`)
console.log(`[registry] wrote ${publicRoot} (2 schemas)`)
