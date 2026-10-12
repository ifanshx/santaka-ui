/**
 * Minimal static server for the example apps, used by the Playwright browser
 * tests. Deliberately dependency-free and read-only: it serves files from the
 * repo root and refuses to escape it.
 *
 * The plain-HTML example loads modules and stylesheets with relative paths
 * straight out of the packages, so the browser exercises the real build output
 * rather than a copy.
 */
import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, normalize, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

// `dirname` first: the argument is a file path, so resolving ".." from it would
// climb from the file's own directory rather than from its parent.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")
const port = Number(process.env.PORT ?? 4173)

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`)
  // Normalize first, then confirm the result is still inside the repo: a
  // request for `/../../secrets` must not resolve outside the served tree.
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "")
  const filePath = join(repoRoot, requested)

  if (!filePath.startsWith(repoRoot + sep) && filePath !== repoRoot) {
    response.writeHead(403).end("Forbidden")
    return
  }

  let target = filePath
  try {
    if (statSync(target).isDirectory()) target = join(target, "index.html")
    statSync(target)
  } catch {
    response.writeHead(404).end("Not found")
    return
  }

  response.writeHead(200, {
    "content-type": MIME[extname(target)] ?? "application/octet-stream",
    "cache-control": "no-store",
  })
  createReadStream(target).pipe(response)
})

server.listen(port, "127.0.0.1", () => {
  console.log(`[examples] serving ${repoRoot} on http://127.0.0.1:${port}`)
})
