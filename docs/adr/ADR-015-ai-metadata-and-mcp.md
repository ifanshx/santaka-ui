# ADR-015: AI metadata schema, llms.txt, and MCP server packaging

- **Status:** Accepted
- **Date:** 2026-10-14
- **Plan deadline:** end of weeks 5–6 (`plan.md` §18)

## Context

`plan.md` §11 makes the component metadata a first-class product surface for AI
tooling, and names three deliverables: the `ai` block on every registry entry,
`llms.txt` + `llms-full.txt`, and a `@santaka-ui/mcp` stdio server. It also
fixes the scope — "the tooling serves validated JSON. No model is called at
build time or at query time, and nothing in this section requires a hosted
service."

This ADR records the schema and the packaging, which is what §18 asks for. All
three deliverables now exist; the decisions below are the ones that were not
obvious once the code existed.

## Decision

### The `ai` block is required on every component, and its fields are enforced

Seven fields, all required, validated by `registry-item-v1` in CI:

| Field | Constraint | Why it is a constraint |
|---|---|---|
| `summary` | one sentence, ≤ 200 chars | It is what an agent reads first; a paragraph is not a summary, and a search result that wraps is not scannable. |
| `whenToUse` | ≥ 1 entry | A component with no stated use is a component nobody can choose. |
| `whenNotToUse` | ≥ 1 entry, **naming the alternative** | §11's rule, and the one that matters most: "a component with no stated alternative is a component nobody can choose correctly." Every entry names a sibling — "use a Radio Group", "use a Toast". |
| `accessibility` | ≥ 1 entry, names the ARIA pattern or role | An agent writing UI needs to know whether it is getting `role="switch"` or a checkbox. |
| `example` | ≥ 1 entry, real markup | Not a sketch: it is copied into a consumer's file. |
| `localesCovered` | array | Stated per component so a locale gap is visible rather than assumed away. |
| `knownLimitations` | array | The honest half. It is also what the component's page shows, generated from this one source so the two cannot drift. |

The schema is `registry-item-v1`, and the published file
(`packages/core/schema/registry-item-v1.json`) is generated from
`src/registry-item-schema.ts` with a test asserting the two never drift — so the
runtime validator, the published schema, and the CI gate are one definition.

### The public surface is derived, not authored

`get_component` (§11) reports "props, variants, events". None of those were in
the registry when this ADR was written, and hand-authoring them per component
would have guaranteed drift the first time a prop was renamed.

They are now **derived at build time** from two committed artifacts:

- **props** — from `packages/web-components/src/components.d.ts`, Stencil's
  generated declarations, which carry each prop's type, `@default`, and doc
  comment. Read from `src/`, not `dist/`, so the build runs on a clean checkout.
- **events** — from the component sources, resolving both dispatch forms: a
  literal `new CustomEvent("sk-tab-change", …)` and the shared emitter
  `emitOpenChange()`, whose event name lives in a constant in `dialog-base.ts`.

The second is the one that would have been wrong by hand. `sk-input`,
`sk-textarea`, and `sk-select` do **not** dispatch `sk-value-change` themselves —
`setupFormControl()` in `shared/form-control-base.ts` does, and they call it. A
per-file scan reports no events for all three. The derivation reads each shared
base's exported functions for the events they construct, so the link is
discovered rather than listed.

Two prop-parse details are recorded because each produced a silently wrong
answer before being fixed: Stencil emits every component **twice** (the class
interface, then `JSX.IntrinsicElements`), and the two differ — the JSX one
carries the form-associated `form` and `name`. A last-wins parse dropped every
prop; a first-only parse dropped the form members. The parser merges them.

### `llms.txt` is authored prose over generated facts

`llms-full.txt` is entirely generated from the registry and the declarations.
`llms.txt` is a curated index whose *component list and token counts* are
generated but whose opening prose — what the library is, how to install it — is
authored in the generator. There is no machine-readable source for "what this
is", so inventing one would be a schema with a single author and no consumer.

Both are verified: `llms:check` regenerates and fails on a diff, per §11's "so
it can never go stale".

### The MCP server is a pure query surface, and its tools are transport-free

`@santaka-ui/mcp` is a stdio server over the same metadata. It reads the registry
and the compiled token CSS **through their package `exports`** —
`@santaka-ui/core/registry` and `@santaka-ui/tokens/css/light.css` — never by a
relative path out of the workspace. A relative path works in the monorepo and
breaks in the published tarball, which is the exact defect ADR-012's contract
exists to prevent; resolving through `exports` means the smoke test and a real
install exercise the same path.

Two packaging decisions:

- **The four tools are plain functions** in `tools.ts`; `server.ts` wires them to
  the SDK. All the reasoning is in the functions, so they are unit-testable
  without a client attached.
- **The smoke test drives a real MCP client** over the SDK's in-memory transport
  pair, rather than importing the functions. That distinction is the whole value:
  importing them would prove the functions work while saying nothing about the
  server — registration, input schemas, serialization, handshake. A server whose
  tools are all correct and whose `registerTool` call is malformed is broken for
  every client and green in every unit test.

Errors are returned as tool results with `isError: true`, not thrown. An MCP
client that receives a transport-level failure tends to retry the same call; a
readable error is something the agent can act on. And a miss is not an error —
`get_component` with an unknown name returns suggestions within a small edit
distance, because an agent that gets a bare failure retries the same wrong name.

### Scope is enforced, not just stated

"No model, no network" is the claim that makes this shippable into an editor
without a key or a telemetry disclosure. It is true by construction: the only
I/O is `readFileSync` at startup, and the only dependency that could reach the
network (`@modelcontextprotocol/sdk`) is used for its transport types. There is
no code path that opens a socket, and no configuration that could add one.

### New registry fields are additive and optional

`props` and `events` were added to the schema as **optional**, not required.
A future non-component entry — a block, a theme, a utility — has no props, and
requiring the field would force an empty array that asserts something false. The
per-component contract test asserts the fields are present and well-formed for
every shipped component, which is where the requirement actually belongs.

## Consequences

- A prop rename in a component now flows to the registry, to `llms-full.txt`, and
  to `get_component` without an edit in three places. The contract test in
  `shipped-registry.test.ts` is what makes that a build failure rather than a
  stale document.
- `@santaka-ui/core` publishes its `registry/` directory and a generated
  `registry/index.json` aggregate, because the MCP server and the future CLI both
  need the whole set without walking a directory. The index is validated against
  the per-component files by a test, so the two cannot diverge.
- The MCP server is a seventh publishable package. It is the first package whose
  `bin` is part of its contract, so the build sets the executable bit rather than
  leaving it to a manual step.
- ADR-006 (docs site) and ADR-009 (source-mode upgrades) remain unwritten; they
  are the docs site and the CLI, neither of which exists.

## What would reverse this

**Embeddings or a hosted index** for `search_components`. §11 rules it out
explicitly — "No embedding service, no API key, no telemetry" — and the reversal
would be a product decision with a privacy cost, not a technical one. The current
scoring (substring and tag matching over `summary`, `whenToUse`, and the name,
with Stable ahead of Preview ahead of Experimental) is deliberately dumb and
inspectable, which is the property that makes it trustworthy for a query an agent
acts on.

**Requiring `props`/`events`** if every future entry is a component. The fields
are optional now because the schema admits blocks and themes; if that stops being
true, the requirement moves into the schema.
