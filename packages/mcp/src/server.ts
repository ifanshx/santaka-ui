/**
 * The stdio MCP server (docs/ARCHITECTURE.md §11).
 *
 * A thin transport over the four tools in `tools.ts`: it declares each tool's
 * input schema, calls the pure function, and returns the result as JSON text.
 * All the reasoning lives in the tools, which is what makes them testable
 * without a client attached.
 *
 * No model is called and no network is reached — the server reads registry
 * metadata and compiled token CSS from disk at startup and answers from memory.
 * That is the contract §11 states, and it is the reason this can run inside an
 * editor without a key, an account, or a telemetry disclosure.
 *
 * Errors are returned as tool results (`isError: true`) rather than thrown: an
 * MCP client that gets a transport-level failure tends to retry the same call,
 * while a readable error is something the agent can act on.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { loadRegistry, type RegistryIndexFile } from "./data.js"
import { getComponentTool, getTokensTool, getUsageTool, searchComponentsTool } from "./tools.js"

/** The framework targets a registry entry can declare. */
const FRAMEWORK = z.enum(["react", "vue", "svelte", "angular", "web-components"])

export type ServerOptions = {
  /** Override the registry data. Tests pass a fixture; the CLI reads the package. */
  registry?: RegistryIndexFile
  name?: string
  version?: string
}

function textResult(payload: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] }
}

function errorResult(message: string): {
  content: Array<{ type: "text"; text: string }>
  isError: true
} {
  return { content: [{ type: "text", text: message }], isError: true }
}

/**
 * Build the server with its four tools registered.
 *
 * Exported separately from `main` so the smoke test can construct a server,
 * connect it to an in-memory transport, and call every tool — which is what
 * §11 asks for ("smoke-tested in CI by launching it and asserting one response
 * shape per tool") without spawning a process per assertion.
 */
export function createServer(options: ServerOptions = {}): McpServer {
  const registry = options.registry ?? loadRegistry()

  const server = new McpServer({
    name: options.name ?? "santaka-ui",
    version: options.version ?? "0.1.0",
  })

  server.registerTool(
    "search_components",
    {
      title: "Search registry items",
      description:
        "Find Santaka UI items for a need — components and blocks (full-screen compositions such as a dashboard or a settings page). Each result carries `type`, and `tag` only when the item is a component (a block is addressed by its name and installs components via `registryDependencies`). Ranks by match, and returns Stable items ahead of Preview and Experimental so a query never silently steers work onto an unstable surface.",
      inputSchema: {
        need: z
          .string()
          .min(2)
          .describe(
            "What the user is trying to build, in their words. E.g. 'delete confirmation'.",
          ),
        constraints: z
          .object({
            framework: FRAMEWORK.optional(),
            interactive: z.boolean().optional(),
            formAssociated: z.boolean().optional(),
          })
          .optional()
          .describe("Narrow the search. Omit to search everything."),
      },
    },
    async ({ need, constraints }) => {
      try {
        return textResult(searchComponentsTool(registry, { need, constraints }))
      } catch (error) {
        return errorResult(`search_components failed: ${describe(error)}`)
      }
    },
  )

  server.registerTool(
    "get_component",
    {
      title: "Get registry item details",
      description:
        "The full record for one item. For a component: props with types and defaults, events, the `sk-*` tag, accessibility notes, example, and known limitations. For a block: empty `props`/`events` and no `tag` (its name is the identifier); the block's composed components (`registryDependencies`), `files`, and example are reported instead.",
      inputSchema: {
        name: z.string().min(1).describe("Item name, with or without the `sk-` prefix."),
        framework: FRAMEWORK.optional().describe("Restrict to a framework the item supports."),
      },
    },
    async ({ name, framework }) => {
      try {
        const result = getComponentTool(registry, { name, framework })
        if (!result.found) {
          return errorResult(
            `${result.error}${
              result.suggestions.length ? ` Did you mean: ${result.suggestions.join(", ")}?` : ""
            }`,
          )
        }
        return textResult(result)
      } catch (error) {
        return errorResult(`get_component failed: ${describe(error)}`)
      }
    },
  )

  server.registerTool(
    "get_tokens",
    {
      title: "Get design tokens",
      description:
        "The token contract for a theme: CSS custom-property name to value, optionally narrowed to one group (color, space, text, shadow, …).",
      inputSchema: {
        theme: z.enum(["light", "dark"]).describe("Which theme's values to report."),
        group: z
          .string()
          .optional()
          .describe("Token group without the prefix, e.g. `color`. Omit for every token."),
      },
    },
    async ({ theme, group }) => {
      try {
        const result = getTokensTool(registry, { theme, group })
        if (group && result.tokens.length === 0) {
          return errorResult(
            `No tokens in group "${group}". Groups: ${result.groups
              .map((entry) => entry.name)
              .join(", ")}`,
          )
        }
        return textResult(result)
      } catch (error) {
        return errorResult(`get_tokens failed: ${describe(error)}`)
      }
    },
  )

  server.registerTool(
    "get_usage",
    {
      title: "Get setup and usage",
      description:
        "Copy-ready install and import lines plus a usage example for the item that best matches a goal. The result carries the item's `type` and `tag` only for a component; for a block, `registryDependencies` lists the components that must be added first.",
      inputSchema: {
        goal: z.string().min(2).describe("What the user wants to build."),
        framework: FRAMEWORK.describe("The framework the snippet is for."),
      },
    },
    async ({ goal, framework }) => {
      try {
        const result = getUsageTool(registry, { goal, framework })
        if (!result.found) return errorResult(result.error)
        return textResult(result)
      } catch (error) {
        return errorResult(`get_usage failed: ${describe(error)}`)
      }
    },
  )

  return server
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Connect to stdio and serve. This is what the `santaka-mcp` bin runs. */
export async function main(): Promise<void> {
  const server = createServer()
  await server.connect(new StdioServerTransport())
}

export { loadRegistry }
