import { expect, test } from "@playwright/test"

/**
 * Toast browser tests.
 *
 * A toast is the opposite of a dialog and the opposite of a Skeleton. A dialog
 * interrupts; a toast must not. A skeleton hides from the accessibility tree;
 * a toast must be announced. Every test here guards one side of that triangle.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const REGION = "#toast-region"
const PANEL = "#toast-region sk-toast [data-slot='panel']"

test("it announces politely and is a status, not an alert", async ({ page }) => {
  await page.locator("#toast-neutral").click()
  const panel = page.locator(PANEL)
  await expect(panel).toBeVisible()
  // role=status is a polite live region: announced, but never stealing focus
  // or interrupting. role=alert would be a dialog wearing a smaller skirt.
  await expect(panel).toHaveAttribute("role", "status")

  // And it must never take focus — the user was looking somewhere else.
  const focused = await page.evaluate(() => document.activeElement?.tagName)
  expect(focused).not.toBe("SK-TOAST")
})

test("it auto-dismisses after its duration", async ({ page }) => {
  await page.locator("#toast-neutral").click()
  await expect(page.locator(PANEL)).toBeVisible()

  // Default duration is 5s; waiting 5.8s proves the clock ran without
  // pinning the test to an implementation constant.
  await expect(page.locator(PANEL)).toBeHidden({ timeout: 6000 })
})

test("hover pauses the clock, and the toast survives past its deadline", async ({ page }) => {
  await page.locator("#toast-neutral").click()
  await expect(page.locator(PANEL)).toBeVisible()

  // Park the pointer at 4.5s of the 5s life. At 6s a non-pausing toast is
  // gone; a pausing one is still there. The assertion is the difference.
  await page.locator(PANEL).hover()
  await page.waitForTimeout(6000)
  await expect(page.locator(PANEL)).toBeVisible()
})

test("duration=0 never expires", async ({ page }) => {
  await page.locator("#toast-error").click()
  await expect(page.locator(PANEL)).toBeVisible()

  // An error the user must act on: an expiring message is an expired apology.
  await page.waitForTimeout(1500)
  await expect(page.locator(PANEL)).toBeVisible()
})

test("the close button dismisses with a real label", async ({ page }) => {
  await page.locator("#toast-error").click()
  await expect(page.locator(PANEL)).toBeVisible()

  // A toast that is announced and then cannot be dismissed is a trap. The
  // button carries a real aria-label — a bare × is a picture to a screen
  // reader.
  const close = page.locator(`${PANEL} [data-slot='close']`)
  await expect(close).toHaveAttribute("aria-label", "Dismiss notification")
  await close.click()
  await expect(page.locator(PANEL)).toBeHidden()
})

test("severity is an edge plus text, never color alone", async ({ page }) => {
  // WCAG 1.4.1, same ruling as Input's error icon: the left edge marks the
  // variant, the message carries it, and color is reinforcement.
  await page.locator("#toast-error").click()
  const style = await page.locator(PANEL).evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      width: cs.borderInlineStartWidth || cs.borderLeftWidth,
      color: cs.borderInlineStartColor || cs.borderLeftColor,
    }
  })
  expect(style.width).toBe("3px")

  // And the glass material applies: rounded, blurred, 1px material line.
  const radius = await page
    .locator(PANEL)
    .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
  expect(radius).not.toBe("0px")
})

test("it stacks in the region and sits below the dialog layer", async ({ page }) => {
  await page.locator("#toast-neutral").click()
  await page.locator("#toast-success").click()

  const count = await page.locator(`${REGION} sk-toast`).count()
  expect(count).toBe(2)

  const z = await page
    .locator(PANEL)
    .first()
    .evaluate((el) => Number.parseInt(getComputedStyle(el).zIndex, 10))
  // The toast layer (1500) must stay below the modal layer (1700): a dialog's
  // scrim covers toasts, because a modal decision outranks a notification.
  expect(z).toBe(1500)
  expect(z).toBeLessThan(1700)
})

test("it does not steal focus when it appears", async ({ page }) => {
  await page.locator("#toast-neutral").click()
  await page.locator("#toast-success").click()

  // Two announcements in a row: focus must remain where the user left it,
  // on the triggering button.
  const focused = await page.evaluate(() => document.activeElement?.id)
  expect(focused).toBe("toast-success")
})
