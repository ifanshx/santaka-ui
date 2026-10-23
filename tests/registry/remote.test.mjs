#!/usr/bin/env node
/**
 * Registry remote-path tests (ADR-007).
 *
 * The CLI had a `registry add <url>` command and a `fetchRemoteRegistry` function
 * that no test reached. A branch no test reaches is a branch that does not work,
 * whatever the type checker says — and this one is the difference between "the
 * CLI supports private registries" being a claim in §8 and being a fact.
 *
 * These run against the **published static payload** in
 * `apps/docs/public/registry/`, served over HTTP, so the test exercises the same
 * bytes a consumer's CLI would fetch rather than a fixture written to match the
 * parser. `node --test`, no dependencies: the assertions are about HTTP status,
 * JSON shape, and validation outcomes.
 */
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { after, before, describe, it } from "node:test"
import assert from "node:assert/strict"

const here = dirname(fileURLToPath(import.meta.url))
// tests/registry -> tests -> repo root
const repoRoot = resolve(here, "..", "..")
const CLI = join(repoRoot, "packages", "cli", "dist", "cli.js")
const PAYLOAD = join(repoRoot, "apps", "docs", "public", "registry")

/**
 * How many entries the payload publishes. Read rather than hardcoded: the CLI has
 * to report every entry it is served, and three assertions here used to name the
 * count of the day (`21`), which is how they went stale while the component set
 * grew to twenty-six — a grep for a number, not a check on the CLI.
 */
const PAYLOAD_ITEMS = JSON.parse(readFileSync(join(PAYLOAD, "index.json"), "utf8")).items
const PAYLOAD_COUNT = PAYLOAD_ITEMS.length

const quote = (value) => (/\s/.test(value) ? `"${value}"` : value)
/**
 * Run the CLI asynchronously.
 *
 * `spawn`, not `spawnSync`: `spawnSync` blocks this process's event loop, and
 * the HTTP server the CLI is meant to fetch from runs *in this process*. With
 * `spawnSync` the server never accepts the connection and the CLI hangs until
 * it is killed — which is what happened first, and looked like a network fault.
 */
const run = (args, cwd) =>
  new Promise((resolve) => {
    const child = spawn(quote(process.execPath), [quote(CLI), ...args.map(quote)], {
      cwd,
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, NO_COLOR: "1" },
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.stderr.on("data", (chunk) => (stderr += chunk))
    child.on("close", (status) => resolve({ status, stdout, stderr }))
  })

const cleanups = []
const tmp = (prefix) => {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  cleanups.push(dir)
  return dir
}

after(() => {
  for (const dir of cleanups) rmSync(dir, { recursive: true, force: true })
})

/**
 * Serve a directory over HTTP on an ephemeral port.
 *
 * The response is written exactly once: the body is read first, and only then are
 * the headers sent. The first version called `writeHead` before a `readFileSync`
 * that could throw, so a miss wrote 200 and then 404 on the same response —
 * "Cannot write headers after they are sent to the client".
 *
 * `close()` is wrapped so it resolves: a plain `server.close()` returns while
 * keep-alive sockets are still open, and the test's `rmSync` of the scratch
 * directory then failed with EBUSY on Windows.
 */
async function serve(root, transform = (body) => body) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1")
    const file = join(root, decodeURIComponent(url.pathname))
    let body
    try {
      body = transform(readFileSync(file, "utf8"))
    } catch {
      body = null
    }
    if (body === null) {
      response.writeHead(404, { "content-type": "application/json" })
      response.end('{"error":"not found"}')
      return
    }
    response.writeHead(200, { "content-type": "application/json" })
    response.end(body)
  })
  // No keep-alive: each request is its own connection, so close() is prompt.
  server.keepAliveTimeout = 0
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const close = () =>
    new Promise((resolve) => {
      server.closeAllConnections?.()
      server.close(resolve)
    })
  return { close, port: server.address().port }
}

describe("the published registry payload", () => {
  before(() => {
    assert.ok(
      existsSync(join(PAYLOAD, "index.json")),
      "apps/docs/public/registry/index.json is missing. Run `pnpm --filter @santaka-ui/core build`.",
    )
  })

  it("is one document with every shipped entry", () => {
    const document = JSON.parse(readFileSync(join(PAYLOAD, "index.json"), "utf8"))
    assert.equal(document.version, 1)
    assert.ok(Array.isArray(document.items) && document.items.length > 0)
    assert.match(document.registryVersion, /^\d+\.\d+\.\d+$/)
  })

  it("pins an immutable copy per version", () => {
    const current = JSON.parse(readFileSync(join(PAYLOAD, "index.json"), "utf8"))
    const pinned = JSON.parse(
      readFileSync(join(PAYLOAD, `v${current.registryVersion}`, "index.json"), "utf8"),
    )
    assert.deepEqual(pinned.items, current.items)
  })

  it("publishes one file per component, at both addresses", () => {
    const document = JSON.parse(readFileSync(join(PAYLOAD, "index.json"), "utf8"))
    for (const item of document.items) {
      assert.ok(
        existsSync(join(PAYLOAD, `${item.name}.json`)),
        `missing current file for ${item.name}`,
      )
      assert.ok(
        existsSync(join(PAYLOAD, `v${document.registryVersion}`, `${item.name}.json`)),
        `missing pinned file for ${item.name}`,
      )
    }
  })

  it("serves the schema every entry advertises", () => {
    // Each entry carries `$schema: "<origin>/schema/registry-item-v1.json"`.
    // That URL was a dead link for as long as it existed: the schemas were
    // written to `packages/core/schema/` and never copied into the published
    // tree, so an editor or a third-party registry following it got a 404 —
    // regardless of whether the domain resolved. This asserts the address an
    // entry advertises actually has a file behind it.
    const document = JSON.parse(readFileSync(join(PAYLOAD, "index.json"), "utf8"))
    const advertised = document.items[0].$schema
    assert.ok(advertised, "entries must advertise a $schema")

    const path = new URL(advertised).pathname.replace(/^\//, "")
    const served = join(repoRoot, "apps", "docs", "public", path)
    assert.ok(
      existsSync(served),
      `every entry advertises ${advertised}, but ${path} is not in the published tree`,
    )
  })

  it("publishes both schemas, and the index schema is the one it names", () => {
    const document = JSON.parse(readFileSync(join(PAYLOAD, "index.json"), "utf8"))
    for (const name of ["registry-item-v1.json", "registry-index-v1.json"]) {
      const file = join(repoRoot, "apps", "docs", "public", "schema", name)
      assert.ok(existsSync(file), `${name} is not published at /schema/${name}`)
    }
    const indexSchema = JSON.parse(
      readFileSync(
        join(repoRoot, "apps", "docs", "public", "schema", "registry-index-v1.json"),
        "utf8",
      ),
    )
    assert.equal(indexSchema.$id, document.$schema.replace(/^\.\//, ""))
  })
})

describe("a registry over HTTP", () => {
  it("is fetched, validated, and reported by the CLI", async () => {
    const { close, port } = await serve(PAYLOAD)
    try {
      const dir = tmp("santaka-registry-")
      writeFileSync(
        join(dir, "package.json"),
        `${JSON.stringify({ name: "registry-test", private: true, type: "module" }, null, 2)}\n`,
      )
      const result = await run(["registry", `http://127.0.0.1:${port}/index.json`], dir)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      assert.match(result.stdout, /registered http:\/\/127\.0\.0\.1/)
      assert.match(result.stdout, new RegExp(`${PAYLOAD_COUNT} valid entries`))
      // The trust sentence is the point of ADR-007 and must be printed.
      assert.match(result.stdout, /untrusted until you have reviewed it/)

      const config = JSON.parse(readFileSync(join(dir, "santaka-registries.json"), "utf8"))
      assert.deepEqual(config.registries, [`http://127.0.0.1:${port}/index.json`])
    } finally {
      await close()
    }
  })

  it("fails loudly on a non-JSON 404 rather than silently installing nothing", async () => {
    const { close, port } = await serve(PAYLOAD)
    try {
      const dir = tmp("santaka-registry-404-")
      writeFileSync(
        join(dir, "package.json"),
        `${JSON.stringify({ name: "registry-test", private: true, type: "module" }, null, 2)}\n`,
      )
      const result = await run(["registry", `http://127.0.0.1:${port}/nope.json`], dir)
      assert.notEqual(result.status, 0)
      assert.match(result.stdout, /404/)
    } finally {
      await close()
    }
  })

  it("rejects an entry that fails the schema, and says which one", async () => {
    // Mutate a valid payload in flight: drop the required `ai` block. Validation
    // must reject the entry and the CLI must still succeed on the good ones,
    // reporting the bad one rather than dropping it silently.
    const { close, port } = await serve(PAYLOAD, (body) => {
      const parsed = JSON.parse(body)
      if (Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map((item) =>
          item.name === "button" ? { ...item, ai: undefined } : item,
        )
      }
      return JSON.stringify(parsed)
    })
    try {
      const dir = tmp("santaka-registry-bad-")
      writeFileSync(
        join(dir, "package.json"),
        `${JSON.stringify({ name: "registry-test", private: true, type: "module" }, null, 2)}\n`,
      )
      const result = await run(["registry", `http://127.0.0.1:${port}/index.json`], dir)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      assert.match(result.stdout, /invalid/)
      assert.match(result.stdout, new RegExp(`${PAYLOAD_COUNT - 1} valid entries`))
    } finally {
      await close()
    }
  })

  it("lets a project install from the remote registry", async () => {
    // The end of the path: an entry fetched over HTTP becomes a component on
    // disk. This is `santaka add` resolving through a configured registry rather
    // than the bundled one.
    const { close, port } = await serve(PAYLOAD)
    try {
      const dir = tmp("santaka-registry-add-")
      writeFileSync(
        join(dir, "package.json"),
        `${JSON.stringify({ name: "registry-test", private: true, type: "module" }, null, 2)}\n`,
      )
      const scoped = join(dir, "app")
      mkdirSync(scoped, { recursive: true })
      writeFileSync(
        join(scoped, "package.json"),
        `${JSON.stringify(
          { name: "app", dependencies: { "@santaka-ui/web-components": "*" } },
          null,
          2,
        )}\n`,
      )
      writeFileSync(
        join(scoped, "santaka-registries.json"),
        `${JSON.stringify({ version: 1, registries: [`http://127.0.0.1:${port}/index.json`] }, null, 2)}\n`,
      )

      const listed = await run(["list"], scoped)
      assert.equal(listed.status, 0, listed.stdout + listed.stderr)
      // The remote entries are visible: the counts line is derived from the
      // entries the payload publishes (ADR-022 §4), so the numbers are read
      // from the payload rather than from a count of the day.
      const byType = {}
      for (const item of PAYLOAD_ITEMS) byType[item.type] = (byType[item.type] ?? 0) + 1
      const expected = Object.entries(byType)
        .map(([type, count]) => `${count} ${type}${count === 1 ? "" : "s"}`)
        .join(", ")
      assert.ok(listed.stdout.includes(expected), `expected "${expected}" in list output`)

      const added = await run(["add", "badge"], scoped)
      assert.equal(added.status, 0, added.stdout + added.stderr)
      assert.ok(existsSync(join(scoped, "src/components/sk-badge/sk-badge.tsx")))
    } finally {
      await close()
    }
  })
})
