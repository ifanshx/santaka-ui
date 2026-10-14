/**
 * Package entrypoint.
 *
 * `createServer` is exported so a consumer can mount the server on any
 * transport the MCP SDK supports — stdio is the default, but an editor host may
 * want HTTP. `main` is the stdio entry the `santaka-mcp` bin runs.
 */
export { createServer, main } from "./server.js"
export type { ServerOptions } from "./server.js"
export {
  getComponentTool,
  getTokensTool,
  getUsageTool,
  searchComponentsTool,
  TOOLS,
} from "./tools.js"
export type {
  ComponentDetail,
  GetComponentInput,
  GetComponentResult,
  GetTokensInput,
  GetTokensResult,
  GetUsageInput,
  GetUsageResult,
  SearchInput,
  SearchResult,
  ToolName,
} from "./tools.js"
export { loadRegistry, loadTokens } from "./data.js"
export type { RegistryIndexFile, Token, TokenTheme } from "./data.js"
