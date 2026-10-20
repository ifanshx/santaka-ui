import { expect, test } from "@playwright/test"

/**
 * Breadcrumb browser tests.
 *
 * The ARIA shape is the component's whole contribution, and none of it shows in
 * a screenshot: a named landmark, a list, `aria-current` on the last item, and
 * separators that announce nothing.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("it is a named landmark containing a list", async ({ page }) => {
  // A <nav> is what makes it reachable by landmark navigation; the <ol> is what
  // makes it announce as a hierarchy rather than as unrelated links.
  const nav = page.locator("#breadcrumb-basic nav")
  await expect(nav).toHaveAttribute("aria-label", "Breadcrumb")
  await expect(nav.locator("ol")).toHaveCount(1)
  await expect(nav.locator("li")).toHaveCount(4)
})

test("the last item is the current page, and is not a link", async ({ page }) => {
  // A link to the page you are already on is a no-op that reads as actionable.
  const items = page.locator("#breadcrumb-basic li")
  await expect(items).toHaveCount(4)

  const last = items.nth(3)
  await expect(last.locator('[data-slot="current"]')).toHaveAttribute("aria-current", "page")
  await expect(last.locator("a")).toHaveCount(0)

  // And the ones before it are links, because they are destinations.
  await expect(items.nth(0).locator("a")).toHaveCount(1)
})

test("only the last item carries aria-current", async ({ page }) => {
  // Two "current" items would mean the trail contradicts itself.
  const currents = page.locator('#breadcrumb-basic [aria-current="page"]')
  await expect(currents).toHaveCount(1)
})

test("the separators are drawn, not typed", async ({ page }) => {
  // A `<span>/</span>` between items reads as "slash, slash, slash". There is no
  // text node here — the separator is a CSS pseudo-element.
  const text = await page.locator("#breadcrumb-basic ol").innerText()
  expect(text).not.toContain("/")

  // Drawn, so it exists as a pseudo-element on every item after the first.
  const separator = await page
    .locator("#breadcrumb-basic li")
    .nth(1)
    .evaluate((el) => getComputedStyle(el, "::before").content)
  expect(separator).not.toBe("none")
})

test("an empty trail renders nothing rather than an empty landmark", async ({ page }) => {
  // An empty <nav> with no list is a landmark that announces nothing, which is
  // worse than no landmark at all.
  await expect(page.locator("#breadcrumb-empty nav")).toHaveCount(0)
  await expect(page.locator("#breadcrumb-empty")).toBeHidden()
})
