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

test("brutalist chrome: thick border, no radius, hard offset shadow", async ({ page }) => {
  const button = page.locator('sk-button[variant="primary"]').first()
  const style = await button.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      borderWidth: cs.borderTopWidth,
      borderStyle: cs.borderTopStyle,
      radius: cs.borderTopLeftRadius,
      boxShadow: cs.boxShadow,
    }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.borderStyle).toBe("solid")
  expect(style.radius).toBe("0px")
  // A hard offset shadow has a nonzero x/y offset and a zero blur radius.
  // Chromium serializes the token's color as oklch() because the theme emits
  // it inside an @supports block; the geometry, not the color's format, is what
  // this asserts.
  expect(style.boxShadow).not.toBe("none")
  expect(style.boxShadow).toMatch(/^\S+\([^)]*\) (-?\d+(?:\.\d+)?)px (-?\d+(?:\.\d+)?)px 0px/)
})

test("the press moves the control and shrinks its shadow", async ({ page }) => {
  const button = page.locator('sk-button[variant="primary"]').first()
  const rest = await button.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { shadow: cs.boxShadow, x: cs.translate }
  })
  expect(rest.shadow).not.toBe("none")

  await button.hover()
  // The arcade curve overshoots, so the resting translate has to be polled for
  // rather than read on the next frame.
  await expect
    .poll(async () => button.evaluate((el) => getComputedStyle(el).translate))
    .toBe("-2px -2px")
  const hovered = await button.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(hovered).not.toBe(rest.shadow)
  // The 2px lift is half the 3px stroke: the control stays registered to its
  // place in the layout while the shadow does the moving.
})

test("the focus ring is a hard 3px ring at 3px offset", async ({ page }) => {
  const button = page.locator('sk-button[variant="primary"]').first()
  await button.focus()
  const ring = await button.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { width: cs.outlineWidth, offset: cs.outlineOffset, style: cs.outlineStyle }
  })
  expect(ring.style).not.toBe("none")
  expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(3)
  expect(Number.parseFloat(ring.offset)).toBeGreaterThanOrEqual(3)
})
