#!/usr/bin/env node
/**
 * Run the browser matrix locally and refresh the support matrix document
 * (`plan.md` §4, §17).
 *
 * Each project runs on its own so its exit code is the result — no reporter
 * parsing is needed to attribute a failure to an engine. The document itself is
 * written by `generate-support-matrix.mjs`, which derives it from the Playwright
 * config; this script's job is to actually launch the engines and then refresh
 * that document.
 *
 * `CI=1` is set for the child runs because the config marks the Firefox and
 * WebKit projects as ignored off CI (a match-nothing `testIgnore`), since only
 * Chromium is provisioned by default on a developer machine. Without it, this
 * script reports "No tests found" for two engines and records them as failed
 * without launching them. Run `playwright install chromium firefox webkit` first.
 *
 * Usage:
 *   pnpm --filter @santaka-ui/web-components test:support-matrix
 */
import { spawnSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")

/** The three engines the browser baseline names (ADR-014). */
const PROJECTS = ["chromium-baseline", "firefox-baseline", "webkit-baseline"]

let anyFailed = false

for (const project of PROJECTS) {
  console.log(`\n[support-matrix] running ${project}`)
  const run = spawnSync("playwright", ["test", "--project", project, "--reporter", "line"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: pkgRoot,
    env: { ...process.env, CI: "1" },
  })
  if (run.status !== 0) {
    anyFailed = true
    console.log(`[support-matrix] ${project}: failed`)
  } else {
    console.log(`[support-matrix] ${project}: passed`)
  }
}

const generate = spawnSync("node", [join(here, "generate-support-matrix.mjs")], {
  stdio: "inherit",
  shell: process.platform === "win32",
})
if (generate.status !== 0) process.exit(generate.status ?? 1)

process.exit(anyFailed ? 1 : 0)
