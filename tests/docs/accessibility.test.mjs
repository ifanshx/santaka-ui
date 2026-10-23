/**
 * Accessibility gate for the built documentation site.
 *
 * The landing page claims the system is "accessible by test, not by claim".
 * A claim like that is only true if something fails when it stops being true,
 * so this suite runs axe-core over the real built pages — in light and dark,
 * as the claim says — and fails when a violation appears.
 *
 * It runs against `apps/docs/dist`, so `build` must run first: what is tested
 * is the artefact that ships, not the source that produced it. axe cannot see
 * into a page that was never built, and a green run against source would say
 * nothing about the deployed site.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { join, extname } from "node:path"
import { chromium } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const root = new URL("../../apps/docs/dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")

/** Pages that must be clean. The landing page is the one that makes the claim. */
const pages = [
  "/",
  "/changelog/",
  "/components/slider/",
  "/components/tabs/",
  "/guides/theming/",
  "/quick-start/",
  "/showcase/",
]

const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
}

/** Serves the built site so axe sees the same bytes a browser would. */
function serve() {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(req.url.split("?")[0])
    if (path.endsWith("/")) path += "index.html"
    try {
      const body = await readFile(join(root, path))
      res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" })
      res.end(body)
    } catch {
      res.writeHead(404).end("not found")
    }
  })
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)))
}

let server
let browser
let origin

test.before(async () => {
  // The suite is meaningless without a build, and saying so is more useful
  // than reporting seven empty pages as passing.
  try {
    await stat(join(root, "index.html"))
  } catch {
    throw new Error("apps/docs/dist is missing — run `astro build` before the accessibility suite")
  }
  server = await serve()
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch()
})

test.after(async () => {
  await browser?.close()
  await new Promise((resolve) => server.close(resolve))
})

for (const path of pages) {
  for (const scheme of ["light", "dark"]) {
    test(`${path} is clean in ${scheme} mode`, async () => {
      const context = await browser.newContext({ colorScheme: scheme })
      const page = await context.newPage()
      await page.goto(origin + path, { waitUntil: "networkidle" })
      // Components upgrade after hydration; measuring before that would test a
      // page whose ARIA has not been applied yet.
      await page.waitForTimeout(800)

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()

      await context.close()

      const detail = results.violations
        .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target?.join(" ")}`)
        .join("\n  ")
      assert.equal(results.violations.length, 0, `axe violations on ${path} (${scheme}):\n  ${detail}`)
    })
  }
}
