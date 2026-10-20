import { test, type Page } from "@playwright/test"
import { expectNoAxeViolations } from "./a11y"

/**
 * Waits until every registered custom element has upgraded.
 *
 * Two separate traps made this wait report the wrong thing, and both are worth
 * recording because the failure looked like a timeout and was not one:
 *
 * - `slot-fb` is Stencil's slot fallback: a hyphenated tag that is never
 *   defined and never hydrates. Requiring *every* hyphenated tag hung the wait
 *   in every engine. Only registered elements count.
 * - The 60 s timeouts under `verify` were not slowness. `web-components#test`
 *   depended on `^build` alone, so nothing ordered this package's own build
 *   before the suites, and `apps/storybook:test` pulled that build in
 *   concurrently. The build starts with `rimraf dist loader`, and the suites
 *   serve `dist/` from disk — so the page 404ed its module, no element
 *   registered, and this wait spun to its ceiling. Fixed in
 *   `packages/web-components/turbo.json`; no timeout would ever have helped.
 *
 * The budget stays generous for the honest reason — the page mounts every
 * component and shares the cores with the other browser suites — but a failure
 * now names the elements that did not upgrade instead of reporting a bare
 * "Timeout exceeded".
 */
async function waitForHydration(page: Page) {
  const timeout = 30_000
  try {
    await page.waitForFunction(
      () => {
        const custom = Array.from(document.querySelectorAll<HTMLElement>("*")).filter((el) => {
          const tag = el.tagName.toLowerCase()
          return tag.includes("-") && customElements.get(tag) !== undefined
        })
        return custom.length > 0 && custom.every((el) => el.classList.contains("hydrated"))
      },
      undefined,
      { timeout },
    )
  } catch {
    // Re-derive the state rather than re-throwing the timeout: "which elements"
    // is the question the bare error leaves unanswered.
    const pending = await page.evaluate(() => {
      const custom = Array.from(document.querySelectorAll<HTMLElement>("*")).filter((el) => {
        const tag = el.tagName.toLowerCase()
        return tag.includes("-") && customElements.get(tag) !== undefined
      })
      return {
        pending: [
          ...new Set(
            custom
              .filter((el) => !el.classList.contains("hydrated"))
              .map((el) => el.tagName.toLowerCase()),
          ),
        ],
        undefinedTags: [
          ...new Set(
            Array.from(document.querySelectorAll("*"))
              .map((el) => el.tagName.toLowerCase())
              .filter((tag) => tag.includes("-") && customElements.get(tag) === undefined),
          ),
        ],
        registered: custom.length,
      }
    })
    throw new Error(
      `Custom elements did not upgrade within ${timeout} ms.\n` +
        `  not hydrated: ${pending.pending.join(", ") || "(none — the module never registered anything)"}\n` +
        `  registered elements on the page: ${pending.registered}\n` +
        `  hyphenated tags with no definition: ${pending.undefinedTags.join(", ") || "(none)"}`,
    )
  }
}

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
  // The budget is raised for the *test*, not only for the wait below: the hook
  // runs inside the test's timeout, so a longer `waitForFunction` alone would
  // still be cut off at 30 s.
  test.setTimeout(90_000)
  await page.goto("/examples/vanilla-html/index.html")
  // Every custom element must be upgraded before a scan: an inert <sk-input>
  // renders no label wiring, and axe would report violations the upgraded
  // element does not have. Waiting for *the first* `.hydrated` — then a fixed
  // 500 ms — is not the same thing as waiting for all of them.
  await waitForHydration(page)
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

test.describe("axe scans — WCAG 2.0/2.1/2.2 A+AA", () => {
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
