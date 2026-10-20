/**
 * Runs the Playwright suite, honouring `PLAYWRIGHT_PROJECT`.
 *
 * `playwright test` launches every project in the config — chromium, firefox,
 * webkit, and `visual` — so any environment that installed only one engine fails
 * on a missing browser binary rather than on a test.
 *
 * `PLAYWRIGHT_PROJECT=chromium-baseline pnpm test` narrows the run to one
 * project. It is read here rather than interpolated into the npm script because
 * npm's shell differs per platform, and this package's CI job runs on three: a
 * `${VAR:+word}` expansion in a package.json script is not portable.
 *
 * The visual project is never implied. It is excluded by default and runs
 * through `pnpm run test:visual` in the pinned image (ADR-019), because a
 * screenshot diff needs a reviewer rather than a job.
 */
import { existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const project = process.env.PLAYWRIGHT_PROJECT?.trim()
// Extra args come after `test`, so `pnpm test -- --list` and a project flag
// given on the command line both land where Playwright expects them.
const args = ["test", ...process.argv.slice(2)]
if (project) {
  args.push("--project", project)
}

// pnpm hoists Playwright's binary to the workspace root when the lockfile allows
// it and keeps it in this package when it does not, so both are tried rather
// than assuming which one applies. Spawning the bare name and hoping the shell
// resolves it is what failed first: it found nothing.
const name = process.platform === "win32" ? "playwright.CMD" : "playwright"
const bin = [
  resolve(pkgRoot, "node_modules", ".bin", name),
  resolve(pkgRoot, "..", "..", "node_modules", ".bin", name),
].find((candidate) => existsSync(candidate))
if (!bin) {
  console.error(`[web-components] playwright binary not found`)
  process.exit(1)
}

const child = spawn(bin, args, {
  cwd: pkgRoot,
  stdio: "inherit",
  // Windows needs the shell: the resolved binary is a `.CMD` wrapper, which
  // cannot be spawned directly. Signals do not propagate through it, so the
  // exit code is what this runner forwards.
  shell: process.platform === "win32",
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
