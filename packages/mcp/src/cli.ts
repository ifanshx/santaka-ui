#!/usr/bin/env node
/**
 * The `santaka-mcp` bin.
 *
 * A one-line entry that exists so the bin points at something with a shebang
 * rather than at the library entry, which a consumer may also import.
 */
import { main } from "./server.js"

main().catch((error: unknown) => {
  // A stdio server must never write to stdout on failure: stdout is the
  // protocol channel, and a stray line corrupts the session. Diagnostics go to
  // stderr, which the client surfaces as the server's log.
  console.error("santaka-mcp failed to start:", error instanceof Error ? error.message : error)
  process.exit(1)
})
