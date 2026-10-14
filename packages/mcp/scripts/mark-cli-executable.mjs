/**
 * Make the built CLI entry executable.
 *
 * `tsc` emits the shebang line unchanged but does not set the executable bit,
 * so a `bin` pointing at it fails with "permission denied" on install. Doing
 * this in the build rather than by hand means the published tarball is correct
 * from the build, not from a step somebody remembered.
 *
 * A no-op on Windows, where the executable bit does not exist and npm shims the
 * bin instead.
 */
import { chmodSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

if (process.platform !== "win32") {
  const here = dirname(fileURLToPath(import.meta.url))
  const cli = resolve(here, "..", "dist", "cli.js")
  chmodSync(cli, 0o755)
  console.log(`[mcp] marked ${cli} executable`)
} else {
  console.log("[mcp] skipped chmod (windows)")
}
