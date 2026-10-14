import { test } from "@playwright/test"
import { expectNoAxeViolations } from "./a11y"

/**
 * Whole-page axe scans over the vanilla example (ADR-008).
 *
 * The example page mounts every component in its documented states, so a
 * violation here names a shipped component, not a fixture. The scans are
 * split by section so a failure names the component rather than pointing at
 * a page of 500 lines, and a theme pass checks the dark palette's contrast
 * rather than only the light one.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
  // Every custom element must be upgraded before a scan: an inert <sk-input>
  // renders no label wiring, and axe would report violations the upgraded
  // element does not have.
  await page.waitForSelector(".hydrated", { timeout: 15_000 })
  await page.waitForTimeout(500)
})

test.describe("axe scans — WCAG 2.0/2.1 A+AA", () => {
  test("the full page passes at rest in the light theme", async ({ page }) => {
    await expectNoAxeViolations(page, "full page, light theme")
  })

  test("the full page passes in the dark theme", async ({ page }) => {
    // The theme switcher sets data-sk-theme on <html>; the same markup, the
    // dark palette. Contrast rules re-evaluate against the dark tokens.
    await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
    await page.waitForTimeout(300)
    await expectNoAxeViolations(page, "full page, dark theme")
  })

  test("form controls pass while the validation bubble is armed", async ({ page }) => {
    // Submitting the probe form with required fields empty arms :user-invalid
    // and the error texts — the state where contrast and label wiring matter
    // most, and the state a rest-state scan never sees.
    await page.evaluate(() => (document.getElementById("probe") as HTMLFormElement).requestSubmit())
    await page.waitForTimeout(300)
    await expectNoAxeViolations(page, "full page, after an invalid submit")
  })
})
