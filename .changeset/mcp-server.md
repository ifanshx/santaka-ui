---
"@santaka-ui/core": minor
"@santaka-ui/mcp": minor
---

A stdio MCP server over the registry metadata, with the four tools plan.md
section 11 names. No model is called and no network is reached — the only I/O is
reading the registry and the compiled token CSS at startup, which is what makes
this shippable into an editor without a key or a telemetry disclosure.

Three decisions did the real work.

The public surface is derived, not authored. get_component reports props and
events, neither of which was in the registry. Props come from the committed
components.d.ts; events come from the component sources with the shared-base
dispatch resolved. That second one is why this is a parse and not a list: Input,
Textarea, and Select do not dispatch sk-value-change themselves — setupFormControl
in shared/form-control-base.ts does, and they call it. A per-file scan reports no
events for all three, confidently and wrongly.

The smoke test drives a real MCP client over the SDK's in-memory transport pair
rather than importing the tool functions. Importing them would prove the
functions work while saying nothing about the server — registration, input
schemas, serialization, handshake. A server whose tools are all correct and whose
registerTool call is malformed is broken for every client and green in every unit
test. 19 unit tests cover the tool behavior; the smoke test covers the server.

The registry gained a generated aggregate: @santaka-ui/core now publishes
registry/ and a generated registry/index.json, because the MCP server and the
future CLI both need the whole set without walking a directory. A test asserts
the index agrees with the per-component files byte for byte.

Two parser details are recorded because each produced a silently wrong answer
first. Stencil emits every component twice — the class interface, then
JSX.IntrinsicElements — and the two differ, the JSX one carrying the
form-associated form and name members, so a last-wins parse dropped every prop
and a first-only parse dropped the form members. And the index schema is written
by the build rather than checked in by hand, because `clean` is `rimraf dist
schema`: a hand-authored file there survives until the first clean build and then
disappears.

llms.txt now reads through the same shared parser instead of its own copy.
