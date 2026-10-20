import { expect, test } from "@playwright/test"

/**
 * Pagination browser tests.
 *
 * What matters is what a screen reader hears: a named landmark, page numbers
 * that are links because a page is a destination, `aria-current` on the current
 * one, a decorative ellipsis that announces nothing, and Prev/Next with real
 * names rather than punctuation.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("it is a named landmark", async ({ page }) => {
  await expect(page.locator("#pagination-mid nav")).toHaveAttribute("aria-label", "Pagination")
})

test("the current page is marked and is not a link", async ({ page }) => {
  // A link to the page you are on is a no-op that reads as actionable.
  const current = page.locator('#pagination-mid [aria-current="page"]')
  await expect(current).toHaveCount(1)
  await expect(current).toHaveAttribute("aria-disabled", "true")
  await expect(page.locator('#pagination-mid a[aria-current="page"]')).toHaveCount(0)
})

test("other page numbers are links, because a page is a destination", async ({ page }) => {
  // A <button> would misdescribe navigation as an action.
  const links = page.locator("#pagination-mid a")
  expect(await links.count()).toBeGreaterThan(0)
})

test("the window shows the first, the last, and a window around the current page", async ({
  page,
}) => {
  // 12 pages, current 6: 1 … 5 6 7 … 12. The first and last always show, which
  // is what tells the reader how far the range extends.
  // Read from the page slots' visible glyph, not the whole <li>: each item also
  // carries a visually hidden word ("Page 6, current page"), so `allInnerTexts`
  // returns more than the number.
  const numbers = await page
    .locator('#pagination-mid [data-slot="page"] [aria-hidden="true"]')
    .allInnerTexts()
  expect(numbers.map((t) => t.trim())).toContain("1")
  expect(numbers.map((t) => t.trim())).toContain("12")
  // Two ellipses, one on each side of the window.
  await expect(page.locator('#pagination-mid [data-slot="ellipsis"]')).toHaveCount(2)
})

test("the ellipsis announces nothing", async ({ page }) => {
  // "…" is not a page. It is empty, hidden, and carries no link or button — so
  // it is not a stop in the list and cannot take focus.
  const ellipsis = page.locator('#pagination-mid [data-slot="ellipsis"]').first()
  await expect(ellipsis).toHaveAttribute("aria-hidden", "true")
  await expect(ellipsis.locator("a, button")).toHaveCount(0)
})

test("Prev and Next carry real accessible names", async ({ page }) => {
  // "‹" alone announces as a punctuation mark, so each step carries a visually
  // hidden word beside the glyph.
  const steps = page.locator('#pagination-mid [data-slot="step"]')
  await expect(steps).toHaveCount(2)
  await expect(steps.nth(0)).toContainText("Previous page")
  await expect(steps.nth(1)).toContainText("Next page")

  // The glyph itself is hidden, so the word is what is announced.
  await expect(steps.nth(0).locator('[aria-hidden="true"]')).toHaveText("‹")
})

test("Prev is unavailable on the first page", async ({ page }) => {
  const steps = page.locator('#pagination-first [data-slot="step"]')
  await expect(steps.nth(0)).toHaveAttribute("aria-disabled", "true")
  // The step element itself is the <a> when it is available, so the check is on
  // its tag rather than on a child — `locator("a")` would find nothing either
  // way and the assertion would pass vacuously.
  expect(await steps.nth(0).evaluate((el) => el.tagName.toLowerCase())).toBe("span")
  expect(await steps.nth(1).evaluate((el) => el.tagName.toLowerCase())).toBe("a")
})

test("Next is unavailable on the last page", async ({ page }) => {
  const steps = page.locator('#pagination-last [data-slot="step"]')
  await expect(steps.nth(1)).toHaveAttribute("aria-disabled", "true")
  expect(await steps.nth(0).evaluate((el) => el.tagName.toLowerCase())).toBe("a")
  expect(await steps.nth(1).evaluate((el) => el.tagName.toLowerCase())).toBe("span")
})

test("picking a page moves the current marker", async ({ page }) => {
  // The component owns the window arithmetic, so the click path is the one that
  // proves `aria-current` follows the value rather than staying put.
  await page.locator("#pagination-mid a", { hasText: "7" }).first().click()
  await expect(page.locator('#pagination-mid [aria-current="page"]')).toContainText("7")
})
