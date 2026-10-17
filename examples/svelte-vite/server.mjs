/**
 * The example's server.
 *
 * It does the two things a server-rendering host has to do, and nothing else:
 * serve the built client assets, and render the page for a document request.
 *
 * Why this exists instead of SvelteKit: `@sveltejs/kit` requires TypeScript 6
 * and `@sveltejs/kit@2` requires Vite 7, while this repository pins TypeScript
 * 5.9.3 and Vite 8.3.4 (docs/adr/ADR-021-svelte-support-and-ssr-path.md). The
 * alternative to writing this file was raising the TypeScript major for every
 * package, which is a much larger change than the claim being tested needs.
 *
 * The HTML is read once at startup. Vite owns `dist/client` and writes one HTML
 * file there with the hashed stylesheet and module tags already injected; this
 * server only fills the placeholder, so asset hashing stays Vite's job.
 */
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { dirname, extname, join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { renderAppHtml } from "./dist/server/entry-server.js"

const here = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(here, "dist", "client")
const port = Number(process.env.PORT ?? 4176)
const host = "127.0.0.1"

/** Every type this example can actually emit. Anything else is not served. */
const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
])

const template = await readFile(join(clientDir, "index.html"), "utf8")

/** The server render happens per request: it is the page, not a fixture. */
function renderDocument() {
  return template.replace(
    "<!--app-html-->",
    // The rendered markup goes into the document as-is. It is this server's own
    // component tree, not consumer input, which is why no escaping is applied
    // here — escaping it would render the page as text.
    renderAppHtml(),
  )
}

function send(response, status, contentType, body) {
  response.writeHead(status, { "content-type": contentType })
  response.end(body)
}

async function handle(request, response) {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`)

  if (url.pathname === "/" || url.pathname === "/index.html") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      // Server-rendered HTML is per-request, so it must not be cached.
      "cache-control": "no-store",
    })
    response.end(renderDocument())
    return
  }

  // Resolve against the client directory, then confirm the result is still
  // inside it. The URL parser already removes `..` segments, so this is the
  // second line of defence rather than the only one.
  const file = resolve(clientDir, `.${url.pathname}`)

  if (file !== clientDir && !file.startsWith(clientDir + sep)) {
    send(response, 403, "text/plain; charset=utf-8", "forbidden")
    return
  }

  try {
    const body = await readFile(file)
    send(response, 200, CONTENT_TYPES.get(extname(file)) ?? "application/octet-stream", body)
  } catch {
    // A missing asset is a 404, and the reason is not sent to the client: the
    // filesystem error would name paths inside the build.
    send(response, 404, "text/plain; charset=utf-8", "not found")
  }
}

createServer((request, response) => {
  handle(request, response).catch((error) => {
    console.error("[svelte-example] request failed", error)
    if (!response.headersSent) {
      send(response, 500, "text/plain; charset=utf-8", "internal error")
    } else {
      response.end()
    }
  })
}).listen(port, host, () => {
  console.log(`[svelte-example] serving http://${host}:${port}`)
})
