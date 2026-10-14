#!/usr/bin/env node
/**
 * Generate (or verify) visual-regression baselines in the pinned Playwright
 * image (ADR-019).
 *
 * Usage:
 *   node scripts/visual-baseline-docker.mjs            # verify
 *   node scripts/visual-baseline-docker.mjs --update   # rewrite the baselines
 *
 * Why Docker: a screenshot baseline encodes font rasterization, subpixel
 * antialiasing, and the exact Chromium build. Two machines produce two
 * different pictures of the same markup, so a baseline generated on one is a
 * permanent diff on the other. The image tag matches @playwright/test in
 * package.json — bumping the dependency without bumping this tag is the
 * mismatch ADR-019 names as the failure mode to watch for.
 *
 * Why Node rather than a shell script: `bash` on a Windows checkout may be the
 * WSL relay with no distribution installed, which fails with an unhelpful
 * "execvpe(/bin/bash)" error. Node is present on every machine that can run
 * the test suite, and spawning `docker` is the same call everywhere. The shell
 * logic itself lives in `visual-baseline-entrypoint.sh`, which runs inside the
 * container where bash is guaranteed.
 */
import { spawnSync } from "node:child_process"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")

/** Keep in lockstep with the `@playwright/test` version in package.json. */
const PLAYWRIGHT_VERSION = "1.64.0"
const IMAGE = `mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`

const update = process.argv.includes("--update")
const modeArgs = update ? "--update-snapshots" : ""

/** Where the baselines land on the host; mounted writable on its own. */
const snapshotDir = `${repoRoot}/packages/web-components/e2e/visual.visual.ts-snapshots`
mkdirSync(snapshotDir, { recursive: true })

console.log(`[visual] image: ${IMAGE}`)
console.log(`[visual] mode:  ${update ? "update" : "verify"}`)
console.log(`[visual] host:  ${repoRoot}`)

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--ipc=host",
    // The source tree is mounted read-only: everything the run needs to write
    // happens on the copy at /work. The snapshot directory is the single
    // exception, mounted writable on its own, because those files are the
    // whole point of the run.
    "-v",
    `${repoRoot}:/host:ro`,
    "-v",
    `${snapshotDir}:/out`,
    "-e",
    `MODE_ARGS=${modeArgs}`,
    "-e",
    "SK_VISUAL=1",
    "-e",
    "CI=1",
    IMAGE,
    "bash",
    "/host/packages/web-components/scripts/visual-baseline-entrypoint.sh",
  ],
  { stdio: "inherit" },
)

if (result.error) {
  console.error(`[visual] failed to run docker: ${result.error.message}`)
  console.error("[visual] is Docker installed and running?")
  process.exit(1)
}

process.exit(result.status ?? 1)
