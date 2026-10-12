/**
 * Diagnostic: load the vanilla example in a real browser and report what the
 * page actually contains. Used when a Playwright assertion fails for a reason
 * that is not visible in the test output (a module that 404s, a registration
 * error, a selector that never matches).
 *
 * Usage: node scripts/debug-page.mjs [url-path]
 */
import { chromium } from "@playwright/test"

const path = process.argv[2] ?? "/examples/vanilla-html/index.html"
const base = process.env.BASE_URL ?? "http://127.0.0.1:4173"

const browser = await chromium.launch()
const page = await browser.newPage()

const problems = []
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    problems.push(`console.${message.type()}: ${message.text()}`)
  }
})
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
page.on("requestfailed", (request) =>
  problems.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`),
)
page.on("response", (response) => {
  if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`)
})

const response = await page.goto(`${base}${path}`)
console.log(`status: ${response?.status()}`)
await page.waitForTimeout(1200)

console.log(`title: ${await page.title()}`)
console.log(`sk-button elements: ${await page.locator("sk-button").count()}`)
const registeredName = await page.evaluate(
  () => window.customElements.get("sk-button")?.name ?? "NOT DEFINED",
)
console.log(`registered: ${registeredName}`)

if (problems.length === 0) {
  console.log("problems: none")
} else {
  console.log("problems:")
  for (const problem of problems.slice(0, 20)) console.log(`  ${problem}`)
}

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)
