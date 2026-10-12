import { expect, test } from "@playwright/test"

/**
 * Link browser tests.
 *
 * The load-bearing property is that `sk-link` is a real anchor. Middle-click,
 * "open in new tab", and copying the URL are browser features of `<a>`; a
 * click-handler `div` has none of them, so the anchor is asserted rather than
 * assumed.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("renders a real anchor with the given href", async ({ page }) => {
  const anchor = page.locator('sk-link[href="#variants"] a')
  await expect(anchor).toHaveCount(1)
  await expect(anchor).toHaveAttribute("href", "#variants")
})

test("inherits its accessible name from the slotted text", async ({ page }) => {
  const link = page.locator('sk-link[href="#variants"]')
  await expect(link).toContainText("full documentation")
})

test("is keyboard focusable and its anchor carries the focus ring", async ({ page }) => {
  const anchor = page.locator('sk-link[href="#variants"] a')
  await anchor.focus()
  await expect(anchor).toBeFocused()
  const outline = await anchor.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe("none")
})

test("an external link opens in a new tab with a safe rel", async ({ page }) => {
  const anchor = page.locator("sk-link[external] a")
  await expect(anchor).toHaveAttribute("target", "_blank")
  // `noopener` prevents window.opener access; without it the opened page can
  // navigate this one.
  await expect(anchor).toHaveAttribute("rel", /noopener/)
  await expect(anchor).toHaveAttribute("rel", /noreferrer/)
})

test("an external link shows a decorative indicator", async ({ page }) => {
  const icon = page.locator("sk-link[external] [data-slot='external-icon']")
  await expect(icon).toHaveAttribute("aria-hidden", "true")
})

test("a non-external link stays in the current tab", async ({ page }) => {
  const anchor = page.locator('sk-link[href="#variants"] a')
  await expect(anchor).not.toHaveAttribute("target", "_blank")
})

test("a subtle link has no underline until hover", async ({ page }) => {
  const anchor = page.locator("sk-link[data-subtle] a")
  const before = await anchor.evaluate((el) => getComputedStyle(el).textDecorationLine)
  expect(before).toBe("none")

  await anchor.hover()
  await expect
    .poll(async () => anchor.evaluate((el) => getComputedStyle(el).textDecorationLine))
    .not.toBe("none")
})

test("a normal link is underlined at rest", async ({ page }) => {
  const anchor = page.locator('sk-link[href="#variants"] a')
  const decoration = await anchor.evaluate((el) => getComputedStyle(el).textDecorationLine)
  expect(decoration).toContain("underline")
})

test("a link with no destination is not focusable and does not navigate", async ({ page }) => {
  const link = page.locator("sk-link[data-disabled]")
  await expect(link).toHaveAttribute("tabindex", "-1")
  await expect(link).toHaveAttribute("aria-disabled", "true")

  // The anchor is still rendered — a custom element cannot stop a consumer from
  // putting one in the slot — but it carries no href, so it is not a link to
  // the accessibility tree and cannot be activated.
  const anchor = link.locator("a")
  await expect(anchor).toHaveCount(1)
  await expect(anchor).not.toHaveAttribute("href", /.+/)
})

test("exposes documented state attributes", async ({ page }) => {
  const link = page.locator('sk-link[href="#variants"]')
  await expect(link).toHaveAttribute("data-slot", "link")
  await expect(page.locator("sk-link[external]")).toHaveAttribute("data-external", "")
})

test("follows the theme", async ({ page }) => {
  const anchor = page.locator('sk-link[href="#variants"] a')
  const read = () => anchor.evaluate((el) => getComputedStyle(el).color)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  expect(await read()).not.toBe(light)
})
