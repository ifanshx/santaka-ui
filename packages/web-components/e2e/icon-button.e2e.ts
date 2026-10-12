import { expect, test } from "@playwright/test"

/**
 * Icon Button browser tests.
 *
 * The case this component exists for is the one jsdom cannot check: an
 * icon-only control must carry an accessible name, must meet the 44px target at
 * every size, and must not activate while disabled or loading.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("renders the custom element and the slotted icon", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Add item"]')
  await expect(control).toBeVisible()
  await expect(control.locator("svg")).toHaveCount(1)
})

test("derives its accessible name from the label prop", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Delete"]')
  await expect(control).toHaveAttribute("aria-label", "Delete")
})

test("warns instead of silently shipping a nameless control", async ({ page }) => {
  const messages: string[] = []
  page.on("console", (message) => {
    if (message.type() === "warning") messages.push(message.text())
  })

  await page.evaluate(async () => {
    const element = document.createElement("sk-icon-button")
    element.innerHTML = "<svg></svg>"
    document.body.append(element)
    // Give the custom element a frame to connect and render.
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })

  // Section 4's error contract: warn in development, never throw. An empty
  // `aria-label` would be worse than nothing — it overrides the content
  // fallback — so the component refuses to write one.
  expect(messages.join("\n")).toContain("no accessible name")
  const attribute = await page.evaluate(() => {
    const element = document.createElement("sk-icon-button")
    return element.hasAttribute("aria-label")
  })
  expect(attribute).toBe(false)
})

test("marks the icon itself as decorative", async ({ page }) => {
  const icon = page.locator('sk-icon-button[label="Add item"] [data-slot="icon"]')
  await expect(icon).toHaveAttribute("aria-hidden", "true")
})

test("every size meets the 44px minimum target size", async ({ page }) => {
  const selectors = ['sk-icon-button[label="Add item"]', 'sk-icon-button[label="Edit"]']
  for (const selector of selectors) {
    const box = await page.locator(selector).evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return { height: rect.height, width: rect.width }
    })
    expect(box.height, `${selector} height`).toBeGreaterThanOrEqual(44)
    expect(box.width, `${selector} width`).toBeGreaterThanOrEqual(44)
  }
})

test("is square, so the hit target matches what is drawn", async ({ page }) => {
  const box = await page.locator('sk-icon-button[label="Add item"]').evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return { height: Math.round(rect.height), width: Math.round(rect.width) }
  })
  expect(box.width).toBe(box.height)
})

test("activates on click", async ({ page }) => {
  await page.locator('sk-icon-button[label="Edit"]').click()
  await expect(page.locator("#log")).toContainText("clicked")
})

test("is keyboard focusable and activates on Enter", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Add item"]')
  await control.focus()
  await expect(control).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("#log")).toContainText("clicked")
})

test("activates on Space", async ({ page }) => {
  await page.locator('sk-icon-button[label="Add item"]').focus()
  await page.keyboard.press("Space")
  await expect(page.locator("#log")).toContainText("clicked")
})

test("a disabled control does not activate and leaves the tab order", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Unavailable"]')
  await expect(control).toHaveAttribute("tabindex", "-1")
  await control.evaluate((el) => el.click())
  await expect(page.locator("#log")).toHaveText("")
})

test("a loading control is aria-busy and does not activate", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Busy"]')
  await expect(control).toHaveAttribute("aria-busy", "true")
  await control.evaluate((el) => el.click())
  await expect(page.locator("#log")).toHaveText("")
})

test("a loading control replaces the icon with a spinner", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Busy"]')
  await expect(control.locator('[data-slot="spinner"]')).toHaveCount(1)
  await expect(control.locator('[data-slot="icon"]')).toHaveCount(0)
})

test("exposes documented state attributes", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Delete"]')
  await expect(control).toHaveAttribute("data-slot", "icon-button")
  await expect(control).toHaveAttribute("data-state", "idle")
  await expect(page.locator('sk-icon-button[label="Busy"]')).toHaveAttribute(
    "data-state",
    "loading",
  )
})

test("a disabled control is visibly muted", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Unavailable"]')
  await expect(control).toHaveAttribute("data-disabled", "")
  const opacity = await control.evaluate((el) => Number(getComputedStyle(el).opacity))
  expect(opacity).toBeLessThan(1)
})

test("focus ring is visible and not removed", async ({ page }) => {
  const control = page.locator('sk-icon-button[label="Add item"]')
  await control.focus()
  const outline = await control.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe("none")
})
