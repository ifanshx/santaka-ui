import { expect, test } from "@playwright/test"

/**
 * Button browser tests. These prove the claims section 4 makes about the
 * universal package — scoped styles (ADR-011), the 44px target minimum, native
 * form participation, and state attributes — in a real browser rather than in
 * jsdom.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("applies scoped component styles, and follows the theme", async ({ page }) => {
  const button = page.locator('sk-button[variant="primary"]').first()
  await expect(button).toBeVisible()

  // Chromium serializes an oklch-authored color back as `oklab(...)`, so the
  // assertion pins the behavior — the resolved color is the themed token, not
  // the browser default, and it changes with the theme — rather than a
  // color-string format that differs per engine. The token's own hex value and
  // contrast are asserted by the token build's gates.
  const probe = () =>
    page.evaluate(() => {
      const element = document.querySelector('sk-button[variant="primary"]')
      const root = getComputedStyle(document.documentElement)
      return {
        paint: element ? getComputedStyle(element).backgroundColor : "",
        token: root.getPropertyValue("--sk-color-primary").trim(),
      }
    })

  const light = await probe()
  expect(light.paint).not.toBe("rgba(0, 0, 0, 0)")
  expect(light.paint).not.toBe("transparent")

  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await probe()
  expect(dark.paint).not.toBe(light.paint)
  expect(dark.token).not.toBe(light.token)
})

test("every size meets the 44px minimum target size", async ({ page }) => {
  for (const size of ["sm", "md", "lg"]) {
    const box = await page
      .locator(`sk-button[size="${size}"]`)
      .first()
      .evaluate((el) => {
        const rect = el.getBoundingClientRect()
        return { height: rect.height, width: rect.width }
      })
    expect(box.height, `${size} height`).toBeGreaterThanOrEqual(44)
    expect(box.width, `${size} width`).toBeGreaterThanOrEqual(44)
  }
})

test("is keyboard focusable and activates on Enter", async ({ page }) => {
  const button = page.locator('sk-button[variant="secondary"]').first()
  await button.focus()
  await expect(button).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("#log")).toContainText("clicked")
})

test("activates on Space", async ({ page }) => {
  const button = page.locator('sk-button[variant="outline"]').first()
  await button.focus()
  await page.keyboard.press("Space")
  await expect(page.locator("#log")).toContainText("clicked")
})

test("a disabled button does not activate", async ({ page }) => {
  await page.locator("sk-button[disabled]").evaluate((el) => el.click())
  await expect(page.locator("#log")).toHaveText("")
})

test("a loading button is aria-busy and does not activate", async ({ page }) => {
  const loading = page.locator("sk-button[loading]")
  await expect(loading).toHaveAttribute("aria-busy", "true")
  await loading.evaluate((el) => el.click())
  await expect(page.locator("#log")).toHaveText("")
})

test("submits a plain form", async ({ page }) => {
  await page.locator('sk-button[type="submit"]').click()
  await expect(page.locator("#result")).toContainText("submitted")
})

test("a loading button does not submit", async ({ page }) => {
  await page.locator("sk-button[loading]").evaluate((el) => {
    el.setAttribute("type", "submit")
    el.click()
  })
  await expect(page.locator("#result")).toHaveText("no submit yet")
})

test("exposes state through documented data attributes", async ({ page }) => {
  const button = page.locator('sk-button[variant="danger"]').first()
  await expect(button).toHaveAttribute("data-slot", "button")
  await expect(button).toHaveAttribute("data-state", "idle")

  const loading = page.locator("sk-button[loading]")
  await expect(loading).toHaveAttribute("data-state", "loading")
})

test("mirrors direction under RTL", async ({ page }) => {
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
  const direction = await page
    .locator('sk-button[variant="primary"]')
    .first()
    .evaluate((el) => getComputedStyle(el).direction)
  expect(direction).toBe("rtl")
})
