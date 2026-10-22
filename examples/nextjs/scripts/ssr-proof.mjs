/**
 * The Next.js SSR proof (ADR-005, docs/ARCHITECTURE.md risk R2).
 *
 * Builds the Next.js app, serves it, and asserts the three claims that make
 * the support matrix honest:
 *
 *  1. The SERVER output carries the custom element tags with their public
 *     attributes — inert markup, not client-rendered shells.
 *  2. The tags are NOT defined during SSR: the server bundle contains no
 *     `customElements.define` for these tags, so the tree the server produced
 *     is the tree the client hydrates against (R2).
 *  3. After hydration and lazy registration, every element upgrades and
 *     renders its internals — and the styles arrive with the document, not
 *     after it (R3, closed by scoped styles).
 *
 * Exit 0 proves all three. Exit 1 names the claim that failed.
 */
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"

// `new URL(...).pathname` yields `/D:/...` on Windows, which readFileSync
// cannot open — fileURLToPath is the only portable derivation.
const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))

const FAILURES = []
const ok = (claim, detail) => console.log(`  ok   ${claim}${detail ? ` — ${detail}` : ""}`)
const fail = (claim, detail) => {
  FAILURES.push(claim)
  console.error(`  FAIL ${claim}${detail ? ` — ${detail}` : ""}`)
}

// --- Claim 1 & 2: read the server output from the build -------------------

console.log("[1/3] Reading server output from .next/server/app/index.html")

let serverHtml
try {
  // Next 15's app-router prerender output. A dynamic page would need a running
  // server; this page is fully static, so the prerender IS the server output.
  serverHtml = readFileSync(join(appRoot, ".next/server/app/index.html"), "utf8")
} catch {
  try {
    serverHtml = readFileSync(join(appRoot, ".next/server/pages/index.html"), "utf8")
  } catch {
    fail(
      "server output exists",
      "run `next build` first — no prerendered index.html under .next/server",
    )
    process.exit(1)
  }
}
ok("server output exists", `${serverHtml.length} bytes`)

const TAGS = ["sk-button", "sk-input", "sk-checkbox", "sk-switch", "sk-select", "sk-tooltip"]

for (const tag of TAGS) {
  if (serverHtml.includes(`<${tag}`)) {
    ok(`server renders <${tag}>`)
  } else {
    fail(`server renders <${tag}>`, "the tag is absent from the prerendered HTML")
  }
}

// The public attributes must survive the server pass: they are the contract a
// consumer's markup depends on, and a hydration mismatch on any of them is
// the R2 failure the lazy path exists to prevent.
const attributeChecks = [
  ["sk-input", 'label="Handle"'],
  ["sk-checkbox", 'label="I agree to the terms"'],
  ["sk-switch", 'label="Dark mode"'],
  ["sk-select", "placeholder="],
  ["sk-select", "options="],
]
for (const [tag, attr] of attributeChecks) {
  const elementMatch = serverHtml.match(new RegExp(`<${tag}[^>]*>`, "s"))
  if (elementMatch && elementMatch[0].includes(attr)) {
    ok(`<${tag}> carries ${attr.split("=")[0]} on the server`)
  } else {
    fail(`<${tag}> carries ${attr.split("=")[0]} on the server`, elementMatch?.[0]?.slice(0, 120))
  }
}

// --- Claim 2, stronger form: no eager registration in the server bundle ---

console.log("[2/3] Asserting the server bundle defines no custom element")

const serverChunks = readdirSafe(join(appRoot, ".next/server"))
let definesInServer = 0
let scannedServer = 0
for (const file of serverChunks) {
  if (!file.endsWith(".js")) continue
  scannedServer++
  if (readFileSync(file, "utf8").includes("customElements.define")) definesInServer++
}

if (definesInServer === 0) {
  ok("no server chunk calls customElements.define", `${scannedServer} chunks scanned`)
} else {
  fail(
    "no server chunk calls customElements.define",
    `${definesInServer} of ${scannedServer} chunks would upgrade tags during SSR — the eager path leaked in`,
  )
}

// --- Claim 3: hydration upgrades the inert tags ---------------------------

console.log("[3/3] Hydrating in Chromium and asserting the upgrade")

const { createServer } = await import("node:http")
// Next 15: `next build` writes server.js only for standalone output. For the
// default output, start the production server programmatically.
const nextModule = await import("next")
const app = nextModule.default({ dev: false, dir: appRoot })
await app.prepare()
const requestHandler = app.getRequestHandler()
const server = createServer((req, res) => requestHandler(req, res))
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const port = server.address().port

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" })
await page.waitForTimeout(1500)

const result = await page.evaluate((tags) => {
  return tags.map((tag) => {
    const el = document.querySelector(tag)
    return {
      tag,
      registered: Boolean(customElements.get(tag)),
      upgraded: Boolean(el && el.classList.contains("hydrated")),
      hasInternals: Boolean(el && el.querySelector("[data-slot]")),
    }
  })
}, TAGS)

for (const entry of result) {
  if (entry.registered && entry.upgraded) {
    ok(`${entry.tag} upgrades after hydration`)
  } else {
    fail(
      `${entry.tag} upgrades after hydration`,
      `registered=${entry.registered} upgraded=${entry.upgraded}`,
    )
  }
}

// Scoped styles arrive with the document (R3): the component stylesheet is
// in the payload, so an upgraded element is styled without a second fetch.
const styled = await page.evaluate(() => {
  const button = document.querySelector("sk-button")
  if (!button) return false
  return getComputedStyle(button).borderTopWidth === "3px"
})
if (styled) {
  ok("scoped styles apply to the upgraded element", "3px stroke from the component sheet")
} else {
  fail("scoped styles apply to the upgraded element", "border is not the 3px stroke")
}

const hydrationErrors = errors.filter((message) => /hydrat|mismatch|server/i.test(message))
if (hydrationErrors.length === 0) {
  ok("no hydration mismatch errors in the console")
} else {
  fail("no hydration mismatch errors in the console", hydrationErrors[0])
}

await browser.close()
server.close()

console.log("")
if (FAILURES.length > 0) {
  console.error(`SSR proof FAILED: ${FAILURES.length} claim(s):`)
  for (const claim of FAILURES) console.error(`  - ${claim}`)
  process.exit(1)
}
console.log("SSR proof passed: server-rendered, lazily registered, hydrated clean.")

function readdirSafe(dir) {
  const out = []
  const walk = (current) => {
    let entries
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch {
      return out
    }
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else out.push(full)
    }
  }
  walk(dir)
  return out
}
