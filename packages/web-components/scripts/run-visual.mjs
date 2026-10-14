#!/usr/bin/env node
/**
 * Run the visual-regression project (ADR-019).
 *
 * `test:visual` used to be `SK_VISUAL=1 playwright test --project=visual`,
 * which is POSIX shell syntax. npm and pnpm run scripts through the platform
 * shell, so on Windows that line fails with
 * "'SK_VISUAL' is not recognized as an internal or external command" before
 * Playwright is ever reached. Setting the variable here and spawning Playwright
 * is the same call on every platform, and it avoids adding `cross-env` as a
 * dependency for one script.
 *
 * Extra arguments are forwarded, so `pnpm run test:visual -- --update-snapshots`
 * rewrites the baselines. Note that rewriting them outside the pinned Docker
 * image (scripts/visual-baseline-docker.mjs) produces baselines owned by this
 * machine rather than by the environment the project declares — see ADR-019.
 */
import { spawnSync } from "node:child_process"

const result = spawnSync("playwright", ["test", "--project=visual", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, SK_VISUAL: "1" },
})

if (result.error) {
  console.error(`[visual] failed to run Playwright: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
