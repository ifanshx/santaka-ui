import { expect, test, type Page } from "@playwright/test"

/**
 * Visual regression (ADR-019, plan.md §12 test layer 7).
 *
 * Every screenshot is taken twice: once with the document in `ltr` and once
 * with `dir="rtl"`. §17 requires an RTL visual case per component, and the
 * cheapest honest way to satisfy that is to photograph the same component in
 * both directions rather than to hand-write an RTL assertion per file.
 *
 * Two themes are covered too, because the dark palette is where the contrast
 * work landed and a token change that only breaks dark is exactly the change
 * a screenshot catches and a style assertion does not.
 *
 * The spec photographs the example page's sections rather than mounting its
 * own fixtures: the page is the artifact a human reviews, so a diff here is a
 * diff someone can look at. Determinism comes from four things — the pinned
 * Playwright Docker image as the baseline environment, `animations: disabled`
 * and `caret: hide` from the config, a fixed viewport, and waiting for
 * `.hydrated` so no screenshot races the custom-element upgrade.
 */

/** Section ids in the example, one screenshot each. */
const SECTIONS = [
  ["type", "typography"],
  ["icon", "icon buttons"],
  ["link", "links"],
  ["badge", "badges"],
  ["input", "input"],
  ["checkbox", "checkboxes"],
  ["switch", "switches"],
  ["radio", "radio groups"],
  ["textarea", "textarea"],
  ["card", "card"],
  ["select", "select"],
  ["tooltip", "tooltip"],
  ["toast", "toast"],
  ["tabs", "tabs"],
  ["alert", "alert dialog"],
  ["dialog", "dialog"],
  ["structure", "structure"],
  ["loading", "loading"],
  ["materials", "materials"],
] as const

async function prepare(page: Page, dir: "ltr" | "rtl", theme: "light" | "dark") {
  await page.goto("/examples/vanilla-html/index.html")
  // Every element must be upgraded before the shot: an inert <sk-input> is a
  // different picture than a styled one, and the race would make the baseline
  // nondeterministic.
  await page.waitForSelector(".hydrated", { timeout: 15_000 })
  await page.evaluate(
    ({ dir, theme }) => {
      document.documentElement.setAttribute("dir", dir)
      document.documentElement.setAttribute("data-sk-theme", theme)
    },
    { dir, theme },
  )
  // Two frames so the direction and theme changes have painted.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
      ),
  )

  // The theme must actually be in force before the shot. `color-scheme` is
  // declared by the generated token stylesheet (`:root` for light,
  // `[data-sk-theme="dark"]` for dark), so it is the canary for "the CSS
  // loaded at all". Without this assertion a build that skipped the token
  // package renders the page unstyled, every section looks identical in both
  // themes, and `--update-snapshots` happily records 57 baselines that are
  // worthless — which is exactly what happened once. The guard turns that
  // silent corruption into a failing test.
  const colorScheme = await page.evaluate(
    () => getComputedStyle(document.documentElement).colorScheme,
  )
  expect(colorScheme, `the ${theme} token stylesheet must be loaded`).toBe(theme)
}

test.describe("visual regression — light theme", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, "ltr", "light")
  })

  for (const [id, label] of SECTIONS) {
    test(`${label} in ltr`, async ({ page }) => {
      const section = page.locator(`section[aria-labelledby="${id}-heading"]`)
      await expect(section).toBeVisible()
      await expect(section).toHaveScreenshot(`${id}-ltr.png`)
    })
  }
})

test.describe("visual regression — rtl, the §17 per-component case", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, "rtl", "light")
  })

  for (const [id, label] of SECTIONS) {
    test(`${label} in rtl`, async ({ page }) => {
      const section = page.locator(`section[aria-labelledby="${id}-heading"]`)
      await expect(section).toBeVisible()
      await expect(section).toHaveScreenshot(`${id}-rtl.png`)
    })
  }
})

test.describe("visual regression — dark theme", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, "ltr", "dark")
  })

  for (const [id, label] of SECTIONS) {
    test(`${label} in dark`, async ({ page }) => {
      const section = page.locator(`section[aria-labelledby="${id}-heading"]`)
      await expect(section).toBeVisible()
      await expect(section).toHaveScreenshot(`${id}-dark.png`)
    })
  }
})
