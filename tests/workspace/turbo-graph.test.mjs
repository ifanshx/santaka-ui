#!/usr/bin/env node
/**
 * Task-graph contract tests (turbo.json).
 *
 * These exist because of a bug no suite could see. `web-components#test` serves
 * this package's `dist/` from disk, and the root `test` task depends only on
 * `^build` — the *dependencies'* builds. Nothing ordered the package's own build
 * before its tests, so under `verify` (where `apps/storybook:test` pulls that
 * build in through its own `^build`) the build and the tests ran concurrently.
 * The build begins with `rimraf dist loader`; the suite served a directory being
 * deleted, every module request 404ed, no custom element registered, and the
 * axe scans reported a 60 s timeout. Every test in the repo passed alone; only
 * the *graph* was wrong.
 *
 * So the assertions here are about the graph, read from the configuration files
 * rather than by running turbo: a dry run needs a lockfile, a turbo install, and
 * seconds of startup, which is the wrong shape for a contract this small.
 *
 * `node --test`, no dependencies.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import assert from "node:assert/strict"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

/**
 * Reads a turbo config with its comments removed.
 *
 * `turbo.json` is JSONC: every task here is documented in place, and those
 * comments are the record of why a dependency exists. Stripping them keeps the
 * file readable while still parsing it strictly — a comment-aware parser would
 * be a dependency for one file.
 */
function readTurboConfig(path) {
  const raw = readFileSync(path, "utf8")
  // Only whole-line comments appear in these files, which is what makes this
  // safe: a `//` inside a string (a URL, a glob) would otherwise be truncated.
  const withoutComments = raw
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n")
  return JSON.parse(withoutComments)
}

const rootConfig = readTurboConfig(join(repoRoot, "turbo.json"))

/** Packages whose `test` script reads that package's own build output. */
const BUILD_BEFORE_TEST = [
  {
    dir: "packages/web-components",
    why: "the browser suites serve `dist/` and `loader/` through scripts/serve-examples.mjs",
  },
  {
    dir: "apps/docs",
    why: "tests/site.test.mjs asserts against the built `dist/` pages and registry payload",
  },
  {
    dir: "packages/core",
    why:
      "`pretest` and `pretypecheck` compile the validator from `dist/`; the tests also " +
      "assert `react`'s and `styles`' published output, which runs the other way and so " +
      "is named explicitly",
  },
  {
    dir: "packages/svelte",
    why: "the theme suite imports through the package graph to `web-components`' build output",
  },
  {
    dir: "apps/storybook",
    why: "the interaction suites render stories through `@santaka-ui/react`, which is build output",
  },
]

describe("turbo task graph", () => {
  it("root test depends on builds", () => {
    // `^build` is the dependencies' builds; `build` is the package's own. The
    // second was added for the same class of bug the scoped overrides below
    // cover: three of `core`'s scripts read or regenerate its own `dist/`, which
    // passes on a warm checkout for months and fails on a cold runner.
    assert.deepEqual(rootConfig.tasks.test.dependsOn, ["^build", "build"])
  })

  for (const { dir, why } of BUILD_BEFORE_TEST) {
    it(`${dir} runs its own build before its tests`, () => {
      const configPath = join(repoRoot, dir, "turbo.json")
      assert.ok(
        existsSync(configPath),
        `${dir}/turbo.json is missing. Without a package-level override, \`test\` ` +
          `inherits the root's \`^build\`, which does not include this package's ` +
          `own build — and ${why}.`,
      )

      const config = readTurboConfig(configPath)
      assert.deepEqual(
        config.extends,
        ["//"],
        `${dir}/turbo.json must extend the root config rather than restate it, ` +
          `or the root's task definitions stop applying to this package.`,
      )

      const dependsOn = config.tasks?.test?.dependsOn ?? []
      assert.ok(
        dependsOn.includes("build"),
        `${dir}/turbo.json: \`test\` must depend on \`build\` (this package's own), ` +
          `not only \`^build\`. ${why}. Found: ${JSON.stringify(dependsOn)}`,
      )
      assert.ok(
        dependsOn.includes("^build"),
        `${dir}/turbo.json: \`test\` must keep \`^build\`. Dropping it would let ` +
          `the tests run before this package's dependencies are built.`,
      )
    })
  }

  it("no unexpected package-level overrides", () => {
    // The scoped overrides exist because the root task must stay cheap: adding
    // `build` globally would force `storybook build` and `astro build` before
    // unit tests that do not read either output. This asserts the shape of the
    // decision, so a future "just add it to the root" edit fails here with the
    // reason attached rather than silently doubling `verify`.
    const overrides = []
    for (const group of ["packages", "apps", "examples"]) {
      const base = join(repoRoot, group)
      if (!existsSync(base)) continue
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory() && existsSync(join(base, entry.name, "turbo.json"))) {
          overrides.push(`${group}/${entry.name}`)
        }
      }
    }

    const known = new Set(BUILD_BEFORE_TEST.map((item) => item.dir))
    assert.deepEqual(
      overrides.filter((dir) => !known.has(dir)),
      [],
      "A package-level turbo.json exists that this test does not know about. If it " +
        "orders a build before tests, add it to BUILD_BEFORE_TEST with the reason; " +
        "if it is for something else, extend this test deliberately.",
    )
  })
})
