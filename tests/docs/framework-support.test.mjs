#!/usr/bin/env node
/**
 * Framework support matrix tests (docs/ARCHITECTURE.md §3, §16: "The public framework/browser
 * support matrix reflects tested evidence").
 *
 * The matrix's whole value is that a claim in it is backed, so the checks that
 * decide that cannot be verified by reading the generated document: on the
 * current tree every claim is true, and an implementation that reported
 * `Stable` for anything, or that never looked at the tree at all, would produce
 * the same document. The tests feed synthetic rows and a fake tree so each
 * failure mode is exercised even when the repository is honest.
 *
 * The two load-bearing cases:
 *
 *   - A **Stable** row whose example has been deleted must fail. A claim whose
 *     example is gone is a target users will pick and find nothing behind —
 *     the direction of drift that costs the most.
 *   - A **Planned** row whose package now exists must fail. Building an adapter
 *     without updating the document makes it wrong in the other direction, and
 *     silent.
 *
 * `node --test`, no dependencies.
 */
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  NON_FRAMEWORK_APPS,
  NON_FRAMEWORK_PACKAGES,
  OUT_PATH,
  TARGETS,
  collectProblems,
  renderDocument,
  verifyAccounting,
  verifyRow,
} from "../../scripts/generate-framework-support.mjs"

/** A fake tree: the directories that exist and the scripts each one declares. */
function fakeTree({ dirs = [], scripts = {} } = {}) {
  const present = new Set(dirs)
  return {
    dirExists: (rel) => present.has(rel),
    scriptsOf: (rel) => (rel in scripts ? scripts[rel] : null),
    listDirs: () => [],
  }
}

/** A backed Stable row, as a starting point to break one piece at a time. */
function stableRow(overrides = {}) {
  return {
    id: "test",
    target: "Test Target",
    state: "Stable",
    implementation: "An adapter",
    gate: "A gate",
    packages: ["packages/test"],
    examples: ["examples/test"],
    scripts: [{ dir: "examples/test", name: "test" }],
    testCommand: "pnpm --filter test test",
    ciJob: "test-job",
    note: null,
    ...overrides,
  }
}

const backedTree = fakeTree({
  dirs: ["packages/test", "examples/test"],
  scripts: { "examples/test": ["build", "test"] },
})

describe("verifyRow — Stable rows must be backed", () => {
  it("accepts a row whose package, example, and script all exist", () => {
    assert.deepEqual(verifyRow(stableRow(), backedTree), [])
  })

  it("rejects a row whose example has been deleted", () => {
    // Two problems, not one: the directory is gone and so is the `package.json`
    // that was checked for the named script. Both are true; the row is unbacked.
    const problems = verifyRow(stableRow(), fakeTree({ dirs: ["packages/test"] }))
    assert.match(problems.join("\n"), /examples\/test does not exist/)
  })

  it("rejects a row whose adapter package has been deleted", () => {
    const problems = verifyRow(
      stableRow(),
      fakeTree({ dirs: ["examples/test"], scripts: { "examples/test": ["test"] } }),
    )
    assert.match(problems.join("\n"), /packages\/test does not exist/)
  })

  it("rejects a row whose named test script no longer exists", () => {
    const problems = verifyRow(
      stableRow(),
      fakeTree({
        dirs: ["packages/test", "examples/test"],
        scripts: { "examples/test": ["build"] },
      }),
    )
    assert.match(problems.join("\n"), /has no `test` script/)
  })

  it("rejects a row whose example has no package.json at all", () => {
    const problems = verifyRow(stableRow(), fakeTree({ dirs: ["packages/test", "examples/test"] }))
    assert.match(problems.join("\n"), /package\.json is missing/)
  })

  it("rejects a Stable row that names no example", () => {
    const problems = verifyRow(stableRow({ examples: [] }), backedTree)
    assert.match(problems.join("\n"), /names no example application/)
  })

  it("rejects a Stable row that names no test command", () => {
    const problems = verifyRow(stableRow({ scripts: [] }), backedTree)
    assert.match(problems.join("\n"), /names no test command/)
  })
})

describe("verifyRow — Planned rows must not be built", () => {
  const plannedRow = (overrides = {}) => ({
    id: "test",
    target: "Test Target",
    state: "Planned",
    implementation: "An adapter",
    gate: "A gate",
    wouldLiveAt: ["packages/test"],
    note: "Nothing exists.",
    ...overrides,
  })

  it("accepts a Planned row whose directory does not exist", () => {
    assert.deepEqual(verifyRow(plannedRow(), fakeTree()), [])
  })

  it("rejects a Planned row whose package has been built", () => {
    const problems = verifyRow(plannedRow(), fakeTree({ dirs: ["packages/test"] }))
    assert.equal(problems.length, 1)
    assert.match(problems[0], /packages\/test exists, so this target is built/)
  })

  it("rejects a Planned row that does not say what is missing", () => {
    const problems = verifyRow(plannedRow({ note: null }), fakeTree())
    assert.match(problems.join("\n"), /must say what is missing/)
  })
})

describe("verifyRow — malformed rows", () => {
  it("rejects an unknown state rather than guessing", () => {
    const problems = verifyRow(stableRow({ state: "Probably" }), backedTree)
    assert.match(problems.join("\n"), /unknown state/)
  })

  it("rejects a row with no implementation or no gate", () => {
    assert.match(
      verifyRow(stableRow({ implementation: "" }), backedTree).join("\n"),
      /names no planned implementation/,
    )
    assert.match(verifyRow(stableRow({ gate: "" }), backedTree).join("\n"), /names no release gate/)
  })
})

describe("verifyAccounting — every directory is accounted for", () => {
  it("rejects an example that no row names", () => {
    const problems = verifyAccounting([stableRow()], {
      ...fakeTree(),
      listDirs: (rel) => (rel === "examples" ? ["test", "surprise"] : []),
    })
    assert.equal(problems.length, 1)
    assert.match(problems[0], /examples\/surprise is not named by any row/)
  })

  it("rejects a package that is neither a target nor on the not-a-framework list", () => {
    const problems = verifyAccounting([], {
      ...fakeTree(),
      listDirs: (rel) => (rel === "packages" ? ["surprise"] : []),
    })
    assert.match(problems.join("\n"), /packages\/surprise is not named/)
  })

  it("accepts the known non-framework packages and applications", () => {
    assert.deepEqual(
      verifyAccounting([], {
        ...fakeTree(),
        listDirs: (rel) => {
          if (rel === "packages") return [...NON_FRAMEWORK_PACKAGES]
          if (rel === "apps") return [...NON_FRAMEWORK_APPS]
          return []
        },
      }),
      [],
    )
  })
})

describe("the repository's own matrix", () => {
  it("has no unbacked claim and no unaccounted directory", () => {
    assert.deepEqual(collectProblems(TARGETS), [])
  })

  it("is committed exactly as the generator renders it", () => {
    const committed = readFileSync(OUT_PATH, "utf8")
    assert.equal(committed, renderDocument(TARGETS))
  })

  it("names every target once and states a Stable target's CI job", () => {
    const targets = TARGETS.map((row) => row.target)
    assert.equal(new Set(targets).size, targets.length)
    for (const row of TARGETS.filter((entry) => entry.state === "Stable")) {
      assert.ok(row.ciJob, `${row.target} is Stable but names no CI job`)
    }
  })
})
