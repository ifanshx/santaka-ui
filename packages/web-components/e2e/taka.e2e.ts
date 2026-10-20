import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

/**
 * Taka browser tests.
 *
 * The mascot is decorative by rule (§1.8, §13), so the claims that matter are
 * the ones a screenshot cannot make: that it is hidden from assistive
 * technology, that the artwork is drawn rather than fetched, and that reduced
 * motion cancels the idle animation outright.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * The first non-`none` animation name across both animated targets.
 *
 * `wave` animates the crest and `bounce` animates the whole `<svg>`, so reading
 * only one of them would report "none" for whichever mood the other element
 * carries. Both are checked, and `idle` must report none on both.
 */
const animatedMood = (page: Page, id: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return "none"
    const names = [".sk-taka__crest", ".sk-taka__art"]
      .map((child) => el.querySelector(child))
      .filter((node): node is Element => node !== null)
      .map((node) => getComputedStyle(node).animationName)
      .filter((name) => name !== "none")
    return names.length > 0 ? names[0]! : "none"
  }, `#${id}`)

test("the mascot is hidden from assistive technology", async ({ page }) => {
  // A mascot is never the only carrier of meaning — the heading beside it does
  // the talking. `aria-hidden` on the host and `role="presentation"` on the
  // <svg> are the two places that has to hold.
  await expect(page.locator("#taka-idle")).toHaveAttribute("aria-hidden", "true")
  await expect(page.locator("#taka-idle svg")).toHaveAttribute("role", "presentation")
  await expect(page.locator("#taka-idle svg")).toHaveAttribute("focusable", "false")
})

test("the artwork is drawn inline, not fetched", async ({ page }) => {
  // §13: original artwork, never a traced or borrowed asset. An <img> or a
  // background-image would mean an asset file with its own license story, and a
  // network request that an offline consumer would see fail.
  // Proven structurally rather than by watching the network, because the page
  // has already navigated once by the time this test runs and a listener added
  // here would miss the requests that matter. An <img> or a background-image
  // would mean an asset file with its own license story; there is neither.
  await expect(page.locator("#taka-idle img")).toHaveCount(0)
  await expect(page.locator("#taka-idle svg")).toHaveCSS("background-image", "none")
  // The shapes are SVG elements, which is what "drawn" means here.
  await expect(page.locator("#taka-idle svg .sk-taka__body")).toHaveCount(1)
})

test("the artwork renders its shapes", async ({ page }) => {
  // Drawn, so the parts are elements — which is also what makes them themeable
  // through the token-based fill and stroke.
  const svg = page.locator("#taka-idle svg")
  await expect(svg.locator(".sk-taka__body")).toHaveCount(1)
  await expect(svg.locator(".sk-taka__beak")).toHaveCount(1)
  await expect(svg.locator(".sk-taka__eye")).toHaveCount(1)
  await expect(svg.locator(".sk-taka__crest path")).toHaveCount(3)
})

test("idle has no animation; wave and bounce do", async ({ page }) => {
  expect(await animatedMood(page, "taka-idle")).toBe("none")
  expect(await animatedMood(page, "taka-wave")).not.toBe("none")
  expect(await animatedMood(page, "taka-bounce")).not.toBe("none")
})

test("reduced motion removes the animation rather than shortening it", async ({ page }) => {
  // §6: cancel, do not slow. The mascot still looks like the mascot — it just
  // stops moving.
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/examples/vanilla-html/index.html")

  expect(await animatedMood(page, "taka-wave")).toBe("none")
  expect(await animatedMood(page, "taka-bounce")).toBe("none")
})

test("size changes the rendered box", async ({ page }) => {
  const widthOf = async (id: string) => {
    const bounds = await page.locator(`#${id}`).boundingBox()
    return bounds?.width ?? 0
  }
  expect(await widthOf("taka-bounce")).toBeLessThan(await widthOf("taka-wave"))
})
