#!/usr/bin/env node
/**
 * Docs guide links (docs/ARCHITECTURE.md §15: "Document supported setups and errors").
 *
 * The quick-start page links four guides. Three of them did not exist, and
 * nothing caught it: a missing page is a 404 for a reader and a green build for
 * everyone else. Astro does not check internal links, and no test looked at the
 * link set at all.
 *
 * The check is against the **source**, not `dist/`, so it needs no build: every
 * internal `href` in a page must resolve to a page that exists (a route Astro
 * will generate), a static file under `public/`, or one of the routes generated
 * from the registry (`/components/<name>/`).
 *
 * `node --test`, no dependencies.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { it } from "node:test"
import assert from "node:assert/strict"

const ROOT = resolve(import.meta.dirname, "../..")
const PAGES = join(ROOT, "apps/docs/src/pages")
const PUBLIC = join(ROOT, "apps/docs/public")

/** Routes Astro generates from a non-page source, and what generates them. */
const GENERATED_ROUTES = [
  {
    // `/components/<name>/` — one page per registry component (ADR-006).
    pattern: /^\/components\/([^/]+)\/?$/,
    source: () => {
      const registry = join(ROOT, "packages/core/registry")
      return readdirSync(registry)
        .filter((file) => file.endsWith(".json") && file !== "index.json")
        .map((file) => file.replace(/\.json$/, ""))
    },
    why: "the registry entry for that component",
  },
]

/** Every `.astro` page under `src/pages`, with its file contents. */
function pageFiles(dir = PAGES, found = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) pageFiles(path, found)
    else if (entry.endsWith(".astro")) found.push(path)
  }
  return found
}

/**
 * The route Astro will generate for a page file.
 *
 * The rule this reproduces: a directory's page is served at the directory path,
 * `[name].astro` is a dynamic segment, and any other file drops its extension.
 */
function routeOf(file, pagesRoot = PAGES) {
  let route = "/" + relative(pagesRoot, file).split(/[\\/]/).join("/")
  route = route.replace(/\.astro$/, "")
  route = route.replace(/(^|\/)index$/, "$1")
  return route.replace(/\/$/, "") || "/"
}

/** Internal hrefs, with the file they came from. */
export function internalLinks(files = pageFiles()) {
  const links = []
  for (const file of files) {
    const content = readFileSync(file, "utf8")
    for (const match of content.matchAll(/href="(\/[^"#?]*)/g)) {
      links.push({ href: match[1], file })
    }
  }
  return links
}

/**
 * Resolve one link, or explain why it cannot be resolved.
 *
 * Exported so the tests can feed it hrefs a page would never produce: a link to
 * a missing guide, and a link to a component with no registry entry.
 */
export function resolveLink(href, { routes, publicFiles, generated }) {
  const normalized = href.replace(/\/$/, "") || "/"
  if (routes.has(normalized)) return { ok: true }
  if (publicFiles.has(normalized)) return { ok: true }

  for (const route of GENERATED_ROUTES) {
    const match = normalized.match(route.pattern)
    if (match && generated[route.pattern.source]?.includes(match[1])) return { ok: true }
  }

  // A trailing slash is optional in the source and required in the output; the
  // lookup above normalizes it, so reaching here means the target is absent.
  const candidates = [normalized, `${normalized}/`]
  if (candidates.some((candidate) => routes.has(candidate) || publicFiles.has(candidate))) {
    return { ok: true }
  }

  return { ok: false, reason: `no page, static file, or generated route at ${href}` }
}

function tree() {
  const routes = new Set(pageFiles().map((file) => routeOf(file)))
  const publicFiles = new Set()
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walk(path)
      else publicFiles.add("/" + relative(PUBLIC, path).split(/[\\/]/).join("/"))
    }
  }
  walk(PUBLIC)

  const generated = {}
  for (const route of GENERATED_ROUTES) generated[route.pattern.source] = route.source()
  return { routes, publicFiles, generated }
}

it("every internal link on a page resolves to something a reader can open", () => {
  const { routes, publicFiles, generated } = tree()
  const broken = []
  for (const link of internalLinks()) {
    const outcome = resolveLink(link.href, { routes, publicFiles, generated })
    if (!outcome.ok) broken.push(`${relative(ROOT, link.file)} → ${link.href} (${outcome.reason})`)
  }
  assert.deepEqual(broken, [], `broken internal links:\n${broken.join("\n")}`)
})

it("the guides the quick-start page promises are the guides that exist", () => {
  const quickStart = readFileSync(join(PAGES, "quick-start.astro"), "utf8")
  const promised = [...quickStart.matchAll(/href="(\/guides\/[^"]*)"/g)].map((m) => m[1])
  assert.ok(promised.length > 0, "quick-start links no guides, so this test asserts nothing")

  const routes = new Set(pageFiles().map((file) => routeOf(file)))
  for (const href of promised) {
    assert.ok(
      routes.has(href.replace(/\/$/, "")),
      `quick-start links ${href}, which has no page — write it or drop the link`,
    )
  }
})

it("the link check rejects a link to a page that does not exist", () => {
  // Negative case: an implementation that returned `ok` for anything, or that
  // never looked at the tree, would pass the checks above on a tree where every
  // link happens to resolve. This asserts the resolution can fail.
  const { routes, publicFiles, generated } = tree()
  const outcome = resolveLink("/guides/does-not-exist/", { routes, publicFiles, generated })
  assert.equal(outcome.ok, false)
})

it("the link check does not accept a component that has no registry entry", () => {
  const { routes, publicFiles, generated } = tree()
  const outcome = resolveLink("/components/not-a-component/", { routes, publicFiles, generated })
  assert.equal(outcome.ok, false)
})

it("a real component link does resolve, so the generated-route branch is exercised", () => {
  const { routes, publicFiles, generated } = tree()
  const outcome = resolveLink("/components/button/", { routes, publicFiles, generated })
  assert.equal(outcome.ok, true)
})

it("ships a 404 page, and every link on it resolves", () => {
  // Astro writes `src/pages/404.astro` to `dist/404.html`, which is the file a
  // static host serves for an unknown path. Without it a mistyped component
  // name gets the host's own error page — off-brand, and with no way back into
  // the docs. The page is also the one page nobody navigates to during review,
  // so its links are checked here rather than by eye.
  const file = join(PAGES, "404.astro")
  assert.ok(existsSync(file), "src/pages/404.astro is missing; a static host needs dist/404.html")

  const source = readFileSync(file, "utf8")
  const hrefs = [...source.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1])
  assert.ok(hrefs.length > 0, "the 404 page offers no way back, so it asserts nothing")

  const { routes, publicFiles, generated } = tree()
  const broken = hrefs.filter((href) => !resolveLink(href, { routes, publicFiles, generated }).ok)
  assert.deepEqual(
    broken,
    [],
    `the 404 page links to paths that do not exist:\n${broken.join("\n")}`,
  )
})
