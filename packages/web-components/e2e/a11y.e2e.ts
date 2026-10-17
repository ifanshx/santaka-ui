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
  // element does not have. Waiting for *the first* `.hydrated` — then a fixed
  // 500 ms — is not the same thing as waiting for all of them: on a loaded
  // machine the rest upgrade later and the scan reads a half-upgraded page.
  // Measured, not assumed: the two whole-page scans failed once under `verify`'s
  // parallel task load (the only failure in that run), and pass in isolation —
  // 36 repeats under four workers, three engines clean. This waits for the
  // fixture, which is deterministic; it does not retry the assertion.
  await page.waitForFunction(() => {
    // Registered custom elements only: `slot-fb` is Stencil's slot fallback, a
    // hyphenated tag that is never defined and never hydrates — requiring it
    // hung this wait in every engine until the test timed out.
    const custom = Array.from(document.querySelectorAll<HTMLElement>("*")).filter((el) => {
      const tag = el.tagName.toLowerCase()
      return tag.includes("-") && customElements.get(tag) !== undefined
    })
    return custom.length > 0 && custom.every((el) => el.classList.contains("hydrated"))
  })
  // Transitions and finite animations still have to land: axe reads computed
  // styles, and a mid-transition read is a state the page never rests in.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => {
        const timing = (animation.effect as KeyframeEffect | null)?.getTiming()
        return timing?.iterations !== Infinity
      })
      .every((animation) => animation.playState !== "running"),
  )
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
