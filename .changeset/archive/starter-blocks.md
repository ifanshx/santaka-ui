---
"@santaka-ui/core": minor
"@santaka-ui/cli": minor
"@santaka-ui/mcp": minor
"@santaka-ui/web-components": minor
---

Starter blocks, and the field that makes them installable (ADR-022).

`registryDependencies` has been declared in the schema, in the types, and in all
twenty-six shipped entries since the registry existed, and it was read by
nothing: `santaka add` resolved exactly the named entry and copied exactly its
own files. A block is the first item where that matters — its markup is composed
of `sk-*` elements the consumer's project must also have — so `add` now resolves
the dependency closure depth-first, deduplicates by name, refuses a cycle with
the chain named, reports a missing dependency with the entry that asked for it,
and applies the existing conflict/diff/journaled-write/manifest rules to the
whole closure as one plan. A dependency-free install is unchanged, which was
checked byte for byte against the previous binary.

Three blocks ship: `dashboard`, `settings`, and `authentication`. Each is `.html`
plus layout CSS and nothing else — no JavaScript (the elements own their
behavior, ADR-003) and no per-framework variants. Their sources live in
`packages/web-components/src/blocks/` so the CLI's one path-resolution rule
still holds; `registryDependencies` and the CSS variables each block reads are
derived from the markup and stylesheet by the generator rather than authored
beside them, so a block that composes an element with no entry is a build
failure. Every block page passes axe in both themes.

Three claims that were only true while every entry was a component are now
scoped or fixed: `santaka list` prints counts by type, the docs generate
`/blocks/<name>` pages that state the install command and the components it
brings, `llms.txt` lists blocks under their own heading instead of emitting an
`sk-dashboard` tag for an element that does not exist, and the MCP tools report
`type` and a `tag` only where an entry justifies one.

Also fixed, because they were red and misreported coverage: three assertions in
`tests/registry/remote.test.mjs` hardcoded the payload's size (`21`), so the
`registry` CI job had been failing since the last five components landed.

And two lint gaps of the same shape — a directory that no task looked at:

- `examples/vanilla-html`'s scripts were covered by no ESLint config at all.
- `examples/nextjs` had no `lint` script, so turbo never ran a linter over the
  one example that proves the Next.js target; `eslint .` from the root instead
  walked into `.next` build output and reported 2,068 errors about generated
  code. The config now ignores `**/.next/**` (as `.prettierignore` already did)
  and the example has the same `lint` script the Vite examples have.

Finally, four tests were fixed at their cause after a forced `verify` failed on
them while the same suites passed alone:

- The table story queried the scroll region by role before `sk-table` upgraded,
  so the region did not exist yet. It now waits for Stencil's `hydrated` marker,
  the fix the dialog story already documents for the identical race. Two more
  stories (`progress`, `empty-state`) had the same non-retrying role query and
  now use `findByRole`, which retries.
- The whole-page axe scans timed out at 60 s waiting for hydration, twice in a
  row, and the cause was not slowness: `web-components#test` depended on
  `^build` alone, so nothing ordered this package's own build before the
  suites — and `apps/storybook:test` pulled that build in concurrently. The
  build starts with `rimraf dist loader`, and the suites serve `dist/` from
  disk, so the page 404ed its module, nothing registered, and the wait spun to
  its ceiling. `packages/web-components/turbo.json` now adds `build` to that
  package's `test` task, and the wait reports which elements failed to upgrade
  instead of a bare "Timeout exceeded". The scan itself now runs in ~5 s.
