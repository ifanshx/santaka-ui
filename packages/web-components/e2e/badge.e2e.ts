import { expect, test } from "@playwright/test"

/**
 * Badge browser tests. A badge is a static label, so what matters is that each
 * variant actually paints its measured fill, that the brutalist chrome applies,
 * and that the dot variant carries a text label rather than relying on color.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("badge fills come from tokens, not color-mix", async ({ page }) => {
  // A `color-mix()` fill needs Chrome 111 / Safari 16.2 and the support
  // baseline is Chrome 90 / Safari 15.4, so a Core-tier browser would drop the
  // declaration entirely and leave the badge with no fill. A resolved opaque
  // background is the observable proof the token path is what paints it.
  for (const variant of ["neutral", "primary", "success", "warning", "danger"]) {
    const badge = page.locator(`sk-badge[data-variant='${variant}']`).first()
    await expect(badge).toBeVisible()
    const background = await badge.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(background, `${variant} background`).not.toBe("rgba(0, 0, 0, 0)")
  }
})

test("the dot variant carries a visually hidden label", async ({ page }) => {
  const dot = page.locator("sk-badge[dot]").first()
  const label = dot.locator('[data-slot="status-label"]')
  await expect(label).toHaveCount(1)
  await expect(label).toHaveClass(/sk-visually-hidden/)
  await expect(dot).toHaveAttribute("data-slot", "badge")
})

test("the dot is a circle and the pill is square", async ({ page }) => {
  const radius = async (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

  // A status dot is a shape, not a style choice; the pill is chrome.
  expect(await radius("sk-badge[data-dot]")).toBe("9999px")
  expect(await radius('sk-badge[data-variant="success"]')).toBe(
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--sk-radius-md").trim()),
  )
})

test("the brutalist stroke and hard shadow apply to the pill", async ({ page }) => {
  const badge = page.locator('sk-badge[data-variant="success"]').first()
  const style = await badge.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { borderWidth: cs.borderTopWidth, boxShadow: cs.boxShadow }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.boxShadow).not.toBe("none")
  expect(style.boxShadow).toMatch(/px 0px/)
})

test("renders every variant with its slot and size reflected", async ({ page }) => {
  for (const variant of ["neutral", "primary", "success", "warning", "danger"]) {
    const badge = page.locator(`sk-badge[data-variant='${variant}']`).first()
    await expect(badge).toHaveAttribute("data-slot", "badge")
    await expect(badge).toHaveAttribute("data-size", "md")
  }
})
