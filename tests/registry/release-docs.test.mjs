#!/usr/bin/env node
/**
 * Release-document tests (plan.md §17: "Changelog, semver policy, upgrade notes,
 * and migration guidance are prepared").
 *
 * These exist because a release document can be present and still useless: a
 * changelog with no versions, a policy that no configuration implements, or a
 * migrations guide whose links point at files that were moved. Each of those is
 * invisible until someone follows the instructions in the document and finds they
 * do not work.
 *
 * So the assertions are about **consistency between the documents and the
 * repository**, not about prose:
 *
 *   - the policy's stated bump rules match `.changeset/config.json`;
 *   - every document the changelog links to exists;
 *   - the versioned packages are all at the version the changelog claims;
 *   - the packages named in the policy exist and are publishable.
 *
 * `node --test`, no dependencies.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import assert from "node:assert/strict"

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The repository root: `tests/registry` → `tests` → root.
 *
 * This was `resolve(here, "..")` — one level short, so every path below pointed at
 * `tests/packages`, and the failure (`ENOENT: scandir '…\tests\packages'`) looked
 * like the packages had moved rather than like a wrong base. Walking up to
 * `pnpm-workspace.yaml` instead of counting `..` makes it depth-independent.
 */
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

/**
 * Read a file. Accepts a path relative to the repo root, or an absolute path.
 *
 * The absolute form exists because `packagesDir` is already absolute, and
 * `path.join(root, absolute)` does not discard the root — it concatenates, which
 * produced `…\Santaka-UI\…\Santaka-UI\packages\…` and an ENOENT that looked like a
 * missing package.
 */
const read = (path) => readFileSync(isAbsolute(path) ? path : join(repoRoot, path), "utf8")

const packagesDir = join(repoRoot, "packages")
const publishable = readdirSync(packagesDir).filter((name) => {
  const manifest = join(packagesDir, name, "package.json")
  if (!existsSync(manifest)) return false
  try {
    return !JSON.parse(readFileSync(manifest, "utf8")).private
  } catch {
    return false
  }
})

describe("release documents", () => {
  it("all three exist", () => {
    for (const file of ["CHANGELOG.md", "docs/RELEASE.md", "docs/MIGRATIONS.md"]) {
      assert.ok(existsSync(join(repoRoot, file)), `${file} is missing`)
    }
  })

  it("the changelog is honest about there being no release", () => {
    const changelog = read("CHANGELOG.md")
    assert.match(changelog, /No release has been published/i)
    assert.match(changelog, /## \[Unreleased\]/)
  })

  it("every document the changelog links to resolves", () => {
    // A changelog whose migration pointers 404 is worse than one with none: the
    // reader follows the link at the moment they most need it.
    const changelog = read("CHANGELOG.md")
    const links = [...changelog.matchAll(/\]\((\.\/[^)]+)\)/g)].map((match) => match[1])
    assert.ok(links.length > 0, "the changelog links to no documents")
    for (const link of links) {
      const target = link.replace(/^.\//, "").replace(/#.*$/, "")
      assert.ok(
        existsSync(join(repoRoot, target)),
        `changelog links to ${link}, which does not exist`,
      )
    }
  })

  it("the changelog's version claim matches the packages", () => {
    // If this drifts, the changelog is quietly wrong about what was released.
    const changelog = read("CHANGELOG.md")
    const claimed = changelog.match(/Every package is `(\d+\.\d+\.\d+)`/)?.[1]
    assert.ok(claimed, "the changelog does not state a version")
    for (const name of publishable) {
      const version = JSON.parse(read(join(packagesDir, name, "package.json"))).version
      assert.equal(version, claimed, `${name} is ${version}, the changelog says ${claimed}`)
    }
  })

  it("the semver policy defines each bump", () => {
    const policy = read("docs/RELEASE.md")
    for (const term of ["patch", "minor", "major"]) {
      assert.ok(policy.toLowerCase().includes(term), `the policy does not define ${term}`)
    }
    // And the 0.x caveat, which is the one that surprises adopters.
    assert.match(policy, /0\.x/)
  })

  it("the policy's internal-dependency rule is what the config implements", () => {
    // The failure mode: a document promising one thing and a config doing another.
    // The document is what a reviewer reads; the config is what ships.
    const policy = read("docs/RELEASE.md")
    const config = JSON.parse(read(".changeset/config.json"))
    const stated = policy.match(/updateInternalDependencies:\s*"(minor|patch)"/)?.[1]
    assert.ok(stated, "the policy does not state its internal-dependency rule")
    assert.equal(
      config.updateInternalDependencies,
      stated,
      `config is "${config.updateInternalDependencies}", the policy says "${stated}"`,
    )
  })

  it("the policy names the fixed-version group, and the config agrees", () => {
    const policy = read("docs/RELEASE.md")
    const config = JSON.parse(read(".changeset/config.json"))
    assert.match(
      policy,
      /tokens.*styles|styles.*tokens/,
      "the policy does not mention the fixed group",
    )
    const fixed = (config.fixed ?? []).flat()
    assert.ok(
      fixed.includes("@santaka-ui/tokens") && fixed.includes("@santaka-ui/styles"),
      "tokens and styles are not versioned together",
    )
  })

  it("every publishable package is covered by the policy's scope", () => {
    const policy = read("docs/RELEASE.md")
    for (const name of publishable) {
      const manifest = JSON.parse(read(join(packagesDir, name, "package.json")))
      assert.ok(
        policy.includes(manifest.name),
        `@${name} (${manifest.name}) is publishable but absent from the release policy`,
      )
    }
  })

  it("the migrations guide states the shape of an entry", () => {
    const guide = read("docs/MIGRATIONS.md")
    for (const part of ["What changed", "Why", "Before", "Codemod"]) {
      assert.ok(guide.includes(part), `the migration template is missing "${part}"`)
    }
  })

  it("the migrations guide is honest that there is nothing to migrate yet", () => {
    const guide = read("docs/MIGRATIONS.md")
    assert.match(guide, /nothing to migrate|No release has been published/i)
  })
})
