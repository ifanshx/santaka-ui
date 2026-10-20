#!/usr/bin/env node
/**
 * Security-scan classifier tests (plan.md §17, "Dependency licenses and security
 * scans are reviewed").
 *
 * These exist because the scan's reach classification cannot be checked by reading
 * its output on the current tree: every one of the 40 live advisories is rooted at
 * `examples/nextjs`, so the difference between `dev`, `transitive`, and `published`
 * is invisible — an implementation that reports everything as `dev` looks healthy.
 * The tests feed synthetic dependency paths at the shape `pnpm audit` emits so the
 * classes are exercised even when the repository is clean.
 *
 * The load-bearing one is the **transitive** case: a vulnerability one level below
 * a published package's own dependency. It ships, so it must not be classified as
 * tooling. An earlier version of the scan could not tell it apart from `dev`.
 *
 * `node --test`, no dependencies.
 */
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  classifyAdvisory,
  importerRoot,
  publishedDirectDeps,
  publishedDirNames,
} from "../../scripts/scan-security.mjs"

const here = dirname(fileURLToPath(import.meta.url))

/** The repository root: walk up to `pnpm-workspace.yaml`, not by counting `..`. */
function findRepoRoot(start) {
  let current = resolve(start)
  while (true) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) return current
    const parent = dirname(current)
    if (parent === current) throw new Error("could not find pnpm-workspace.yaml above " + here)
    current = parent
  }
}

const repoRoot = findRepoRoot(here)

const publishedDirs = new Set(["core", "react"])
const directDeps = new Map([["ajv", ["core"]]])

/** Build an advisory with the given dependency paths, as pnpm emits them. */
function advisory(module, severity, paths) {
  return {
    module_name: module,
    severity,
    title: `${module} advisory`,
    findings: [{ paths }],
  }
}

describe("importerRoot", () => {
  it("reads the workspace importer and normalises Windows separators", () => {
    assert.equal(importerRoot("examples\\nextjs > next@15.5.4"), "examples/nextjs")
    assert.equal(importerRoot("packages/core > ajv@8.12.0"), "packages/core")
    assert.equal(importerRoot("."), ".")
  })
})

describe("classifyAdvisory", () => {
  it("classifies a direct dependency of a published package as published", () => {
    const row = classifyAdvisory(advisory("ajv", "critical", ["packages/core > ajv@8.12.0"]), {
      directDeps,
      publishedDirs,
    })
    assert.equal(row.reach, "published")
    assert.deepEqual(row.packages, ["core"])
  })

  it("classifies a transitive dependency of a published package as transitive, not dev", () => {
    // `badpkg` is not a direct dependency of anything published, but it is one
    // level down from `core`'s own tree — so installing `core` pulls it in.
    const row = classifyAdvisory(
      advisory("badpkg", "critical", ["packages/core > ajv@8.12.0 > badpkg@1.0.0"]),
      { directDeps, publishedDirs },
    )
    assert.equal(row.reach, "transitive")
    assert.deepEqual(row.packages, [])
    assert.deepEqual(row.roots, ["packages/core"])
  })

  it("classifies an advisory rooted only in an example as dev", () => {
    const row = classifyAdvisory(advisory("next", "critical", ["examples/nextjs > next@15.5.4"]), {
      directDeps,
      publishedDirs,
    })
    assert.equal(row.reach, "dev")
    assert.deepEqual(row.roots, ["examples/nextjs"])
  })

  it("prefers the published reach when a module is also pulled in by an example", () => {
    const row = classifyAdvisory(
      advisory("badpkg", "high", [
        "examples/nextjs > badpkg@1.0.0",
        "packages/react > some-lib@2.0.0 > badpkg@1.0.0",
      ]),
      { directDeps, publishedDirs },
    )
    assert.equal(row.reach, "transitive")
    assert.deepEqual(row.roots, ["examples/nextjs", "packages/react"])
  })

  it("does not treat the private docs app or the monorepo root as published", () => {
    for (const root of ["apps/docs", ".", ""]) {
      const row = classifyAdvisory(advisory("next", "low", [`${root} > next@15.5.4`]), {
        directDeps,
        publishedDirs,
      })
      assert.equal(row.reach, "dev", `root ${JSON.stringify(root)} should be dev`)
    }
  })
})

describe("published direct dependencies (real manifests)", () => {
  it("reads the packages/ directory as the published set", () => {
    const names = publishedDirNames(repoRoot)
    assert.ok(names.includes("core"))
    assert.ok(names.includes("web-components"))
    assert.ok(names.length > 0)
  })

  it("attributes a real runtime dependency to its owning package", () => {
    // Read from whichever package actually declares a runtime dependency, rather
    // than naming `ajv` and `core`. That pair stopped being true when the
    // validator moved to build time — Ajv is now a devDependency, so `core`
    // ships with no runtime dependencies at all, which is the property worth
    // asserting anyway. A test that names a dependency is a test that has to be
    // edited whenever the dependency does.
    const deps = publishedDirectDeps(repoRoot)
    assert.ok(deps.size > 0, "no published package declares a runtime dependency to check")

    for (const [dep, owners] of deps) {
      assert.ok(owners.length > 0, `${dep} has no owning package`)
      for (const owner of owners) {
        assert.ok(
          publishedDirNames(repoRoot).includes(owner),
          `${dep} is attributed to ${owner}, which is not a directory in packages/`,
        )
      }
    }
  })
})
