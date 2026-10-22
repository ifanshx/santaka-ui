#!/usr/bin/env node
/**
 * CI smoke test: launch the server and assert one response per tool
 * (docs/ARCHITECTURE.md §11 — "smoke-tested in CI by launching it and asserting one response
 * shape per tool").
 *
 * This connects over a **real in-memory MCP transport pair**, not by importing
 * the tool functions and calling them. That distinction is the point: importing
 * the functions would prove the functions work while saying nothing about the
 * server — the tool registration, the input schemas, the JSON serialization, or
 * the protocol handshake. A server whose tools are all correct but whose
 * `registerTool` call is malformed is broken for every client and green in every
 * unit test.
 *
 * The process is not spawned; the transport is the SDK's in-memory pair, so the
 * check is fast enough for every CI run and has no port, no subprocess, and no
 * timing.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { createServer } from "../dist/server.js"

/** One call per tool, with the smallest input that must succeed. */
const CALLS = [
  {
    name: "search_components",
    args: { need: "delete confirmation" },
    expect: (payload) => {
      const first = payload.components?.[0]
      if (!first) throw new Error("search_components returned no components")
      if (typeof first.summary !== "string") throw new Error("summary missing")
      if (typeof first.stability !== "string") throw new Error("stability missing")
      if (!Array.isArray(first.whenNotToUse)) throw new Error("whenNotToUse missing")
      return `${payload.components.length} of ${payload.considered} considered, top: ${first.name}`
    },
  },
  {
    name: "get_component",
    args: { name: "button" },
    expect: (payload) => {
      const component = payload.component
      if (!component) throw new Error("get_component returned no component")
      if (!Array.isArray(component.props) || component.props.length === 0) {
        throw new Error("props missing")
      }
      if (typeof component.accessibility !== "string") throw new Error("accessibility missing")
      return `${component.tag}: ${component.props.length} props`
    },
  },
  {
    name: "get_tokens",
    args: { theme: "dark", group: "color" },
    expect: (payload) => {
      if (!Array.isArray(payload.tokens) || payload.tokens.length === 0) {
        throw new Error("tokens missing")
      }
      const token = payload.tokens[0]
      if (typeof token.name !== "string" || typeof token.value !== "string") {
        throw new Error("token shape wrong")
      }
      return `${payload.tokens.length} color tokens in ${payload.theme}`
    },
  },
  {
    name: "get_usage",
    args: { goal: "submit a form", framework: "react" },
    expect: (payload) => {
      if (typeof payload.usage !== "string" || payload.usage.length === 0) {
        throw new Error("usage missing")
      }
      if (!Array.isArray(payload.install) || payload.install.length === 0) {
        throw new Error("install missing")
      }
      return `${payload.component}: ${payload.install.length} setup lines`
    },
  },
]

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
const server = createServer()
const client = new Client({ name: "smoke", version: "0.0.0" })

await server.connect(serverTransport)
await client.connect(clientTransport)

const { tools } = await client.listTools()
const registered = tools.map((tool) => tool.name).sort()
const expected = CALLS.map((call) => call.name).sort()
if (JSON.stringify(registered) !== JSON.stringify(expected)) {
  throw new Error(`registered tools ${registered.join(", ")} != expected ${expected.join(", ")}`)
}
console.log(`[smoke] tools registered: ${registered.join(", ")}`)

let failures = 0
for (const call of CALLS) {
  try {
    const result = await client.callTool({ name: call.name, arguments: call.args })
    if (result.isError) throw new Error(`returned isError: ${JSON.stringify(result.content)}`)
    const text = result.content?.[0]?.text
    if (typeof text !== "string") throw new Error("no text content")
    const detail = call.expect(JSON.parse(text))
    console.log(`[smoke] ${call.name}: ok — ${detail}`)
  } catch (error) {
    failures++
    console.error(
      `[smoke] ${call.name}: FAILED — ${error instanceof Error ? error.message : error}`,
    )
  }
}

await client.close()
await server.close()

if (failures > 0) {
  console.error(`[smoke] ${failures} of ${CALLS.length} tools failed`)
  process.exit(1)
}
console.log(`[smoke] all ${CALLS.length} tools answered`)
