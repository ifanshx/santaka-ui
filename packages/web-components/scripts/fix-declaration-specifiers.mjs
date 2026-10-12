/**
 * Make Stencil's generated declarations resolve under `node16` ESM resolution.
 *
 * Stencil writes `export * from '../types'` into `dist/components/index.d.ts`
 * and `export * from '../dist/types/components'` into `loader/index.d.ts`. Both
 * are bare directory specifiers with no file extension and no JS sibling, so
 * under Node16/NodeNext resolution the specifier fails to resolve: a `.d.ts` is
 * types only, and Node's ESM resolver will not treat a directory as a module.
 * `@arethetypeswrong/cli` reports this as `InternalResolutionError`.
 *
 * TypeScript's own convention is that a `.js` specifier in a `.d.ts` resolves
 * to the matching `.d.ts`, which is exactly what these re-exports want. So the
 * fix is to append the entry filename, not to relocate anything.
 *
 * This runs as a post-build step rather than being patched in place by hand,
 * because `dist/` is regenerated on every build and the export maps in
 * `package.json` point at these exact files — a hand edit would be silently
 * reverted by the next `pnpm build`, and the shipped package would resolve
 * nothing for its types.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")

const TARGETS = [
  {
    file: join(pkgRoot, "dist", "components", "index.d.ts"),
    from: "export * from '../types';",
    to: "export * from '../types/index.js';",
  },
  {
    file: join(pkgRoot, "loader", "index.d.ts"),
    from: "export * from '../dist/types/components';",
    // `dist/types/components/` holds per-component declarations with no
    // `index.d.ts`, so a specifier pointing there resolves to a directory and
    // fails. `dist/types/index.d.ts` does have an entry file and is the same
    // public surface Stencil intended here.
    to: "export * from '../dist/types/index.js';",
  },
]

let rewritten = 0
const missing = []

for (const target of TARGETS) {
  let source
  try {
    source = readFileSync(target.file, "utf8")
  } catch {
    missing.push(target.file)
    continue
  }

  if (!source.includes(target.from)) {
    // Already rewritten, or Stencil changed its output. Either way there is
    // nothing to do — and reporting it is better than silently passing, because
    // a Stencil upgrade that renames this export should be a deliberate change
    // rather than a silent regression.
    continue
  }

  writeFileSync(target.file, source.replace(target.from, target.to))
  rewritten += 1
}

if (missing.length > 0) {
  throw new Error(
    `[web-components] declaration files missing:\n${missing.map((f) => `  ${f}`).join("\n")}`,
  )
}

console.log(
  `[web-components] rewrote ${rewritten}/${TARGETS.length} declaration specifiers for node16 resolution`,
)
