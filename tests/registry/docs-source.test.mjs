#!/usr/bin/env node
/**
 * Documentation-source tests (ADR-006).
 *
 * ADR-006 commits the docs site to generating component pages from the registry
 * rather than hand-writing them. That is a decision with a testable consequence:
 * **a prop renamed in a component must reach the docs, the CLI, the MCP server,
 * and `llms.txt` together or not at all.**
 *
 * What is *not* testable yet is the Astro app itself — `apps/docs` does not
 * exist. So these tests assert the invariant the app will depend on, against the
 * one documentation artifact the build already produces: `llms-full.txt`, which
 * is generated from the registry and is what a documentation page would render.
 * If the registry and the generated reference disagree, an Astro page built on
 * the same data would disagree too.
 *
 * `node --test`, no dependencies: the assertions are about two JSON documents and
 * one text file agreeing with each other.
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { before, describe, it } from "node:test"
import assert from "node:assert/strict"

const here = dirname(fileURLToPath(import.meta.url))
// tests/registry -> tests -> repo root
const repoRoot = resolve(here, "..", "..")

// The same payload a consumer's CLI fetches, and the same artifact an agent reads.
// `tests/` is not a workspace package, so `@santaka-ui/core` does not resolve
// from here. The registry is a file either way, and pointing at it by path is
// also the more honest assertion: this is the document the package publishes.
const REGISTRY_INDEX = join(repoRoot, "packages", "core", "registry", "index.json")
const PUBLISHED_INDEX = join(repoRoot, "apps", "docs", "public", "registry", "index.json")
const DOCS_REFERENCE = join(repoRoot, "apps", "docs", "public", "llms-full.txt")

let registry
let published
let reference

describe("the documentation source is the registry", () => {
  before(() => {
    registry = JSON.parse(readFileSync(REGISTRY_INDEX, "utf8"))
    assert.ok(
      existsSync(PUBLISHED_INDEX),
      "apps/docs/public/registry/index.json is missing. Run the core build.",
    )
    assert.ok(
      existsSync(DOCS_REFERENCE),
      "apps/docs/public/llms-full.txt is missing. Run the core build.",
    )
    published = JSON.parse(readFileSync(PUBLISHED_INDEX, "utf8"))
    reference = readFileSync(DOCS_REFERENCE, "utf8")
  })

  it("the published payload is the registry, not a copy of it", () => {
    // ADR-007: the payload is build output. If it diverged from the package, a
    // consumer installing from the URL and one using the bundled registry would
    // install different components.
    assert.deepEqual(published.items, registry.items)
  })

  it("every component's documentation comes from its registry entry", () => {
    for (const item of registry.items) {
      assert.ok(
        reference.includes(`## sk-${item.name}`),
        `llms-full.txt has no section for sk-${item.name}`,
      )
      // The prose a page would render is the entry's own prose.
      assert.ok(reference.includes(item.ai.summary), `${item.name}: summary absent from the docs`)
      assert.ok(reference.includes(item.ai.example), `${item.name}: example absent from the docs`)
    }
  })

  it("every documented prop is a prop the component declares", () => {
    // The invariant ADR-006 is really about: a prop rename must reach the docs.
    // If the docs carry a prop the registry does not, they were written by hand.
    for (const item of registry.items) {
      if (!item.props || item.props.length === 0) continue
      for (const prop of item.props) {
        assert.ok(
          reference.includes(prop.name),
          `${item.name}: prop ${prop.name} is in the registry but absent from the docs`,
        )
      }
    }
  })

  it("no documented prop is invented: every prop in the docs is declared", () => {
    // The other direction, and the one that catches a stale page. Every
    // `| \`name\` |` row in the docs must correspond to a declared prop on some
    // component.
    const declared = new Set(
      registry.items.flatMap((item) => (item.props ?? []).map((prop) => prop.name)),
    )
    const rows = [...reference.matchAll(/^\| `([a-zA-Z][\w-]*)` \|/gm)].map((match) => match[1])
    assert.ok(rows.length > 0, "no prop rows found in llms-full.txt")
    for (const name of new Set(rows)) {
      assert.ok(declared.has(name), `docs mention prop "${name}" that no component declares`)
    }
  })

  it("events reach the documentation too", () => {
    for (const item of registry.items) {
      if (!item.events || item.events.length === 0) continue
      for (const event of item.events) {
        assert.ok(
          reference.includes(event),
          `${item.name}: event ${event} is in the registry but absent from the docs`,
        )
      }
    }
  })

  it("stability is shown, because the labels are data", () => {
    // §10 asks for separate Stable / Preview / Experimental / Deprecated labels,
    // sourced from the field rather than from an author's heading.
    for (const item of registry.items) {
      assert.ok(
        reference.includes(`- Stability: ${item.stability}`),
        `${item.name}: stability absent`,
      )
    }
  })
})
