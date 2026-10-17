#!/usr/bin/env node
/**
 * Documentation site tests (ADR-006).
 *
 * The site is built, so these assert against `dist/` rather than against source:
 * whether the pages exist, whether they carry the registry's data, and whether the
 * static artifacts the build produces are served as-is. Source-level tests cannot
 * see any of that, and an Astro template that renders nothing still compiles.
 *
 * The most valuable assertion is the drift one: every prop the registry declares
 * must appear on that component's built page. That is ADR-006's real claim —
 * component pages are generated, not written — made observable.
 *
 * `node --test`, no dependencies.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { before, describe, it } from "node:test"
import assert from "node:assert/strict"

const here = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(here, "..")
const dist = join(docsRoot, "dist")
const registryPath = join(docsRoot, "..", "..", "packages", "core", "registry", "index.json")

/**
 * Strip tags and decode the entities Astro and HTML escaping introduce.
 *
 * Both matter. Astro adds `data-astro-cid-*` attributes to scoped elements, so a
 * literal `<h1>` match fails on a page that renders the heading correctly. And
 * registry prose legitimately contains backticks and quotes — `type="submit"` —
 * which arrive as `&quot;`. Comparing raw registry text against escaped HTML would
 * fail on content that is present and correct, which is a false positive, not a
 * finding.
 */
const textOf = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")

/** The rendered heading, ignoring Astro's scoping attribute. */
const headingOf = (html) => {
  const match = html.match(/<h1[^>]*>([^<]*)<\/h1>/)
  return match?.[1]?.trim() ?? ""
}

let registry
let pages
/** The two item types, asserted separately: a block has no tag, no props, and no element (ADR-022). */
let components
let blocks

describe("the built documentation site", () => {
  before(() => {
    assert.ok(
      existsSync(dist),
      "apps/docs/dist is missing. Run `pnpm --filter @santaka-ui/docs build`.",
    )
    registry = JSON.parse(readFileSync(registryPath, "utf8"))
    pages = readdirSync(join(dist, "components"))
    components = registry.items.filter((item) => item.type === "component")
    blocks = registry.items.filter((item) => item.type === "block")
  })

  it("builds one page per registry entry, plus the index", () => {
    for (const item of components) {
      assert.ok(
        existsSync(join(dist, "components", item.name, "index.html")),
        `no page built for ${item.name}`,
      )
    }
    for (const item of blocks) {
      assert.ok(
        existsSync(join(dist, "blocks", item.name, "index.html")),
        `no block page built for ${item.name}`,
      )
    }
    assert.ok(existsSync(join(dist, "index.html")), "no index page")
  })

  it("every component page carries the registry's prose", () => {
    for (const item of components) {
      const html = readFileSync(join(dist, "components", item.name, "index.html"), "utf8")
      assert.equal(headingOf(html), `sk-${item.name}`, `${item.name}: wrong heading`)
      const text = textOf(html)
      assert.ok(text.includes(item.ai.summary), `${item.name}: summary missing`)
      assert.ok(text.includes(item.ai.accessibility), `${item.name}: accessibility missing`)
      assert.ok(text.includes(item.stability), `${item.name}: stability label missing`)
    }
  })

  it("every block page carries the registry's prose and states what it composes", () => {
    for (const item of blocks) {
      const html = readFileSync(join(dist, "blocks", item.name, "index.html"), "utf8")
      // A block is addressed by name: `sk-dashboard` would name an element that
      // does not exist.
      assert.equal(headingOf(html), item.name, `${item.name}: wrong heading`)
      const text = textOf(html)
      assert.ok(text.includes(item.ai.summary), `${item.name}: summary missing`)
      assert.ok(text.includes(item.ai.accessibility), `${item.name}: accessibility missing`)
      assert.ok(text.includes(`npx santaka add ${item.name}`), `${item.name}: no install command`)
      for (const dependency of item.registryDependencies) {
        // Every component the CLI installs alongside the block is reachable from
        // the block's page — the page and the install are the same list.
        assert.ok(
          html.includes(`href="/components/${dependency}/"`),
          `${item.name}: does not link the ${dependency} component it composes`,
        )
      }
      for (const limitation of item.ai.knownLimitations ?? []) {
        assert.ok(text.includes(limitation), `${item.name}: a known limitation is missing`)
      }
    }
  })

  it("every declared prop appears on that component's page", () => {
    // The invariant ADR-006 commits to: a page is generated, not written.
    //
    // This direction alone cannot fail by construction — if a prop were removed
    // from the registry, a generated page would lose it too and both sides would
    // still agree. So the tests below assert the direction that *can* fail: that
    // the published payload equals the registry, and that no prop appears on a
    // page that no component declares. Together they pin both ends.
    for (const item of components) {
      if (!item.props || item.props.length === 0) continue
      const text = textOf(readFileSync(join(dist, "components", item.name, "index.html"), "utf8"))
      for (const prop of item.props) {
        assert.ok(
          text.includes(prop.name),
          `${item.name}: prop ${prop.name} is in the registry but not on the built page`,
        )
      }
    }
  })

  it("no page invents a prop: a hand-edited page fails here", () => {
    // The direction that catches a hand-written page.
    //
    // It parses the built cells — `<td><code>name</code></td>` — rather than
    // guessing at whitespace. The first version matched `name |` against stripped
    // text, never matched a real row, and passed while a prop the component never
    // declared was sitting in the table: a test that reports safety it has not
    // checked.
    for (const item of components) {
      if (!item.props || item.props.length === 0) continue
      const html = readFileSync(join(dist, "components", item.name, "index.html"), "utf8")
      const declared = new Set(item.props.map((prop) => prop.name))
      const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1])
      for (const row of rows) {
        const first = row.match(/<td[^>]*><code[^>]*>([^<]+)<\/code><\/td>/)
        if (!first) continue
        const name = first[1].trim()
        assert.ok(
          declared.has(name),
          `${item.name}: page shows prop "${name}" the component does not declare`,
        )
      }
    }
  })

  it("events and known limitations reach the page too", () => {
    for (const item of components) {
      const text = textOf(readFileSync(join(dist, "components", item.name, "index.html"), "utf8"))
      for (const event of item.events ?? []) {
        assert.ok(text.includes(event), `${item.name}: event ${event} missing`)
      }
      for (const limitation of item.ai.knownLimitations ?? []) {
        assert.ok(text.includes(limitation), `${item.name}: a known limitation is missing`)
      }
    }
  })

  it("serves the generated static artifacts unchanged", () => {
    // ADR-007: the registry payload is the same bytes a CLI fetches. ADR-006:
    // llms.txt is served from the same public directory.
    assert.ok(existsSync(join(dist, "registry", "index.json")))
    assert.ok(existsSync(join(dist, "llms.txt")))
    assert.ok(existsSync(join(dist, "llms-full.txt")))

    const served = JSON.parse(readFileSync(join(dist, "registry", "index.json"), "utf8"))
    assert.deepEqual(served.items, registry.items)
  })

  it("bundles the package CSS rather than serving a copy", () => {
    // ADR-012: the exports map is the contract. A stylesheet under `public/`
    // would be a second copy that could drift from the package.
    const html = readFileSync(join(dist, "index.html"), "utf8")
    const hrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1])
    assert.ok(hrefs.length > 0, "no stylesheet linked")
    for (const href of hrefs) {
      assert.ok(href.startsWith("/_astro/"), `stylesheet ${href} is not a bundled asset`)
    }
    // And the bundle actually contains the component chrome.
    const cssDir = join(dist, "_astro")
    const bundled = readdirSync(cssDir)
      .filter((name) => name.endsWith(".css"))
      .map((name) => readFileSync(join(cssDir, name), "utf8"))
      .join("\n")
    assert.ok(bundled.includes("sk-button"), "the bundled CSS has no sk-button rules")
  })

  it("indexes every page for search", () => {
    // Pagefind is a build-time index (ADR-006): no hosted service.
    const entry = join(dist, "pagefind", "pagefind-entry.json")
    assert.ok(existsSync(entry), "no Pagefind index; run `pagefind --site dist`")
    const parsed = JSON.parse(readFileSync(entry, "utf8"))
    assert.ok(
      parsed.languages?.en?.page_count >= registry.items.length,
      "the index is missing pages",
    )
  })

  it("ships no server runtime", () => {
    // ADR-006: static output. A stray server bundle would contradict it.
    assert.ok(
      !existsSync(join(dist, "server")),
      "dist/server exists; the site is meant to be static",
    )
    void pages
  })
})
