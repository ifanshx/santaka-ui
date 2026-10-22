# ADR-012: Distribution contract — ESM-only, an explicit exports table, and peer ranges

- **Status:** Accepted
- **Date:** 2026-10-12
- **Specification:** §4 of [ARCHITECTURE.md](../ARCHITECTURE.md)

## Context

`docs/ARCHITECTURE.md` §4 fixes the distribution shape for every published package: ESM only,
an explicit `exports` table, and peer dependency ranges. This ADR records the
decision and, more usefully, the two defects the contract caught — because the
value of an exports table is not that it exists, it is that it turns a class of
mistake into a failing check.

`docs/ARCHITECTURE.md` §17 also requires this record; until it existed, ADR-005 cited it for
"weight" and `examples/nextjs/next.config.mjs` cited it for the resolution rule.

## Evidence

### The packages

All nine published packages declare `"type": "module"` and expose only `import`
conditions. There is no `require`, no `main` pointing at CommonJS, and no `.cjs`
file in any tarball.

| Package | Entry | Notes |
|---|---|---|
| `@santaka-ui/tokens` | `./css`, `./css/light.css`, `./css/dark.css` | CSS only; no JS entry |
| `@santaka-ui/styles` | `./reset.css`, `./base.css`, `./primitives.css`, `./glass.css`, `./index.css` | CSS only |
| `@santaka-ui/utilities` | `.` | types + import |
| `@santaka-ui/core` | `.`, `./schema`, `./schema/registry-item-v1.json` | schema as a resolvable subpath |
| `@santaka-ui/web-components` | `.`, `./loader`, `./santaka.css` | two registration paths, see ADR-005 |
| `@santaka-ui/react` | `.`, `./styles.css`, `./jsx` | `./jsx` is the JSX namespace declaration |

Every entry carries a `types` condition. CSS subpaths are bare strings, because a
stylesheet has no types to resolve.

### Defect 1 — 358 KB of unreachable CommonJS

Stencil's `dist` output target emits `dist/cjs/` and `index.cjs.js`
**unconditionally**; `OutputTargetDist` has no `generateCjs` option. That put
358 KB of CommonJS into the published tarball. It was unreachable — the exports
table names only the ESM entrypoints, so no bundler could resolve it — and
therefore **nothing measured it**. The budget tooling measures reachable
entrypoints, so an unreachable artifact is invisible to it by construction.

The lesson is the one this contract is built on: *an exports table is a
measurement boundary as much as a resolution boundary.* The fix is
`scripts/strip-cjs-output.mjs`, which deletes the CommonJS and then verifies the
ESM entrypoints survived. It fails loudly rather than silently skipping.

### Defect 2 — declarations that did not resolve under `node16`

`attw --pack` found that Stencil emits `export * from '../types'` into its
generated declarations — a directory specifier with no file extension. Under
`node16` module resolution that does not resolve, so the shipped types were
broken for any consumer on modern resolution, even though the JS was fine. The
fix is `scripts/fix-declaration-specifiers.mjs`, applied in the build.

This is why `attw --pack` and `publint` are release-blocking rather than
advisory: both defects were invisible to the test suite, because the tests
resolve through the workspace, not through the packed tarball.

### Peer ranges

Internal packages use `workspace:^`, which Changesets rewrites to a real range at
publish. External peers are explicit and bounded:

```json
"peerDependencies": {
  "react": "^18.2.0 || ^19.0.0",
  "react-dom": "^18.2.0 || ^19.0.0"
}
```

`@santaka-ui/web-components` peers `@santaka-ui/styles`, `@santaka-ui/tokens`,
and `@santaka-ui/utilities`; `@santaka-ui/react` peers
`@santaka-ui/web-components`. The graph is acyclic and every peer is a package
the consumer must install deliberately, not a transitive surprise.

Node `>=22.11.0` is an `engines` field on all nine, and CI includes the oldest
supported version in its matrix (`docs/ARCHITECTURE.md` §4).

## Decision

**ESM only, one explicit `exports` table per package, `types` on every JS entry,
and peer dependencies for anything not bundled.**

Enforced by three gates that all run in CI:

- `pnpm run validate:packages` — `publint` and `attw --pack` on the packed
  tarball of all nine packages. Release-blocking.
- `exports-contract.test.ts` — every stylesheet a package builds is reachable
  through `exports`, and every export resolves to a file that exists.
- The build scripts that strip CommonJS and rewrite declaration specifiers, both
  of which fail loudly.

## Consequences

- A CommonJS consumer cannot `require()` any of these packages. That is the
  decision; `docs/ARCHITECTURE.md` §4 rules out a dual build, and the reasoning is that a
  second format doubles the surface for the two defects above to recur.
- Adding a new artifact (a stylesheet, a schema, a subpath) means adding an
  `exports` entry, or it is unreachable and unmeasured. `exports-contract.test.ts`
  is what makes that a test failure rather than a support ticket.
- A Stencil major upgrade must re-run `attw --pack`, because it is the gate that
  caught the declaration-specifier defect. Recorded in ADR-001's consequences too.

## What would reverse this

A supported consumer environment that cannot consume ESM — which would mean
revisiting the browser baseline (ADR-014) first, since every target there ships
ESM. Absent that, the reversal is a dual build plus an ADR explaining why the
measurement boundary is worth widening.
