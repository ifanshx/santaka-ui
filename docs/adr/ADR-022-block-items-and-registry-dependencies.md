# ADR-022: Block items ship markup, and `registryDependencies` becomes a resolved field

- **Status:** Accepted
- **Date:** 2026-10-17
- **Specification:** `docs/ARCHITECTURE.md` §16 ("Publish starter blocks for dashboard, settings, and authentication screens") and §9 ("Component, block, theme, and utility metadata", "Dependency declarations and peer dependency constraints")

## Context

`docs/ARCHITECTURE.md` §16 closes with one engineering item: three starter blocks. The schema
was built for it — `type` already accepts `block`, and `props`/`events` are the
only optional surface fields, which is exactly what a block lacks — and the
registry aggregate, the CLI, `llms.txt`, and the docs all carry `type` through
without filtering on it. What is missing is not a schema decision. It is four
smaller ones, and one of them is not about blocks at all.

The reconnaissance found:

1. **Where a block's files could live.** `resolveItemFiles` resolves a declared
   `files[].path` by mirroring it under one root: the `@santaka-ui/web-components`
   package directory (`componentSourceDir()`). The comment in that function is
   explicit about why — *"mirrored rather than reconstructed: a second naming rule
   here would drift from the one the registry generator uses."* Anywhere else, a
   block's files would need a second root, and therefore a second rule.
2. **`registryDependencies` is declared and read by nothing.** It is in the schema,
   in the TypeScript types, and in all twenty-six committed entries — and it is
   empty in every one of them, because no code has ever needed it. `santaka add`
   resolves exactly the named item and copies exactly its own `files[]`. A block
   is the first item for which the field is load-bearing: its markup is composed
   of `sk-*` elements that the *consumer's* project must also have.
3. **Consumers assume every entry is a component.** `santaka list` ends with
   `N components`, the docs site derives one route per entry at
   `/components/<name>`, `llms.txt` emits `## sk-<name>` for each entry, and
   `packages/core/src/shipped-registry.test.ts` asserts that every entry has
   props and events.
4. **The `registry` CI job was already failing.** Three assertions in
   `tests/registry/remote.test.mjs` named the payload's size as a literal (`21`),
   and the payload has published twenty-six since the last five components
   landed. That is fixed ahead of this ADR (commit `9c0e907`), and it is recorded
   here because it is the same failure mode this ADR has to avoid: a check that
   encodes a count instead of a property.

## Decision

### 1. Block sources ship in the web-components package, under `src/blocks/<name>/`

`packages/web-components/package.json` adds `src/blocks` to `files`, so the three
blocks are inside the tarball that the CLI already resolves paths against. No
second root, no second naming rule, no eleventh package for three pages of
markup.

The cost is stated rather than hidden: block markup is not a web component, and
it now lives in the web-component package. It is there because the alternative —
a root per item type — would put a type switch in path resolution, and that
switch is exactly the drift the existing comment warns about. If a future
registry grows items whose files belong to a *different published package*, the
fix is a `package` field on the file entry, not a naming convention.

### 2. A block is `.html` and `.css`, and nothing else

A block's files are framework-neutral markup that uses the custom elements, plus
a stylesheet limited to layout: logical properties, spacing and colour from the
token set, no component internals. No JavaScript, because the elements own their
behavior (ADR-003) and a block that scripts them would be a second implementation
of it. No React/Vue/Svelte variants, because adapters translate elements and a
block *is* a page composition — three variants per block would be three things to
keep in sync for a copy-paste artifact.

The blocks are `dashboard`, `settings`, and `authentication`, with
`files[].type` set to `registry:block`. The file entry's `type` is a free string
in the schema, so this needs no schema change and no new schema version.

### 3. `registryDependencies` is resolved by `santaka add`

`add` now walks the named item's `registryDependencies` depth-first, installs
them, and then the item — deduplicated by name, cycle-refusing, checksum-verified
per entry, with the existing conflict, diff, and `--overwrite`/`--skip` rules
applied to the whole plan rather than to one item. The dependency set is printed
before anything is written, which is what §9's "display the source, dependency
changes, and file diff before destructive changes" asks for.

The alternative — a block shipping its composed component sources inside its own
`files[]` — was rejected because it duplicates sources that the registry already
publishes, and two copies of `sk-button.tsx` in one registry is a drift bug with
a delay. The other alternative — `add` printing a warning that the block needs
eleven components and leaving the developer to type eleven more commands — was
rejected because the field exists to say exactly that, and a block that installs
markup for elements the project does not have is a broken install, not a
partial one.

Cycle refusal is not a theoretical guard: `registryDependencies` is data from a
registry, which ADR-007 establishes as untrusted until reviewed.

### 4. Consumers stop assuming every entry is a component

`santaka list` reports counts per type (`26 components, 3 blocks`). The docs
generate a page per entry at a route derived from `type`
(`/components/<name>`, `/blocks/<name>`), and the block page states what the
block composes and the exact install command rather than pretending the docs have
their own preview of it. `llms.txt` lists blocks under their own heading instead
of emitting a `sk-<name>` identifier for an item that has no tag. The
shipped-registry, docs-source, and docs-site tests scope their component
assertions to `type: "component"` and gain their block counterparts.

### 5. What counts as proof

Each block is exercised the way the rest of the library is: an example page in
`examples/vanilla-html/` that the axe suite scans, a CLI test that adds the block
into a temporary project and asserts that the block's files *and* every
dependency's files land, and a checksum in the published entry. No screenshot
baseline: the visual-regression requirement in §16 is per component, and a block
page's layout is expected to be edited by the consumer — a baseline there would
pin something the consumer is invited to change, and it would fail on the first
sensible edit.

## Consequences

- Block markup is authored once and consumed per project. It carries no version of
  its own beyond the entry's `version`, and a consumer who edits it owns the edit
  — the CLI's conflict handling already refuses to overwrite a modified file
  without `--overwrite`.
- The dependency walk makes `add` do more work than before for every item, not
  only blocks. For the twenty-six existing components the field is empty, so the
  walk is a no-op and the output is unchanged.
- Registering a block makes the docs, `llms.txt`, and the MCP server describe it
  without further code, because all three already read the registry rather than a
  hand-written list.
- It does not publish anything. `1.0.0` still waits on the support matrix, §16's
  remaining gates, and the legal preconditions in §13.
