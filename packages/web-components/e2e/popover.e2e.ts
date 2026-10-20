import { expect, test } from "@playwright/test"

/**
 * Popover browser tests.
 *
 * The distinction from a tooltip is the whole subject: a tooltip describes and
 * takes no focus; a popover holds controls, so it takes focus, closes on Escape
 * and on an outside click, and returns focus to its trigger. Each test below is
 * one half of that difference.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("the panel is a dialog, not a description", async ({ page }) => {
  // A tooltip is named through `aria-describedby`; a popover is a dialog that
  // holds controls. Announcing its contents as the trigger's description would
  // read the whole panel out as one sentence.
  const panel = page.locator('#popover-bottom [data-slot="panel"]')
  await expect(panel).toHaveAttribute("role", "dialog")

  const trigger = page.locator("#popover-bottom [slot='trigger']")
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
  await expect(trigger).not.toHaveAttribute("aria-describedby", /.+/)
})

test("the trigger reports expanded state", async ({ page }) => {
  // `aria-expanded` is the right signal for a disclosure; `aria-describedby`
  // would be the tooltip's contract, and using it here would be wrong twice.
  const trigger = page.locator("#popover-bottom [slot='trigger']")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")

  await trigger.click()
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(trigger).toHaveAttribute("aria-controls", /.+/)
})

test("opening moves focus into the panel", async ({ page }) => {
  // The reason this is not a tooltip: it owns focus while it is open. A
  // keyboard user must be inside the dialog, not left behind it.
  await page.locator("#popover-bottom [slot='trigger']").click()
  await expect(page.locator('#popover-bottom [data-slot="panel"]')).toBeFocused()
})

test("Escape closes and returns focus to the trigger", async ({ page }) => {
  const trigger = page.locator("#popover-bottom [slot='trigger']")
  await trigger.click()
  await expect(page.locator('#popover-bottom [data-slot="panel"]')).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.locator('#popover-bottom [data-slot="panel"]')).toBeHidden()
  // Focus returns rather than being dropped at the top of the document.
  await expect(trigger).toBeFocused()
})

test("an outside click dismisses it", async ({ page }) => {
  // A tooltip vanishes when you look away; a popover has to be closed, because
  // it holds focus.
  await page.locator("#popover-bottom [slot='trigger']").click()
  await expect(page.locator('#popover-bottom [data-slot="panel"]')).toBeVisible()

  await page.locator("#slider-basic input").click()
  await expect(page.locator('#popover-bottom [data-slot="panel"]')).toBeHidden()
})

test("clicking inside the panel does not dismiss it", async ({ page }) => {
  // Otherwise a popover holding checkboxes would close the moment you used one.
  // This is the case the first implementation failed: the panel was built
  // imperatively and the consumer's children relocated, so a click on slotted
  // content reported the original node — outside the host — and read as outside.
  await page.locator("#popover-bottom [slot='trigger']").click()
  const panel = page.locator('#popover-bottom [data-slot="panel"]')
  await expect(panel).toBeVisible()

  await panel.locator("sk-checkbox").first().click()
  await expect(panel).toBeVisible()
})

test("it takes pointer events, unlike a tooltip", async ({ page }) => {
  // The tooltip sets `pointer-events: none` deliberately, so hovering it never
  // flickers it away. A popover holds controls and must not do that.
  await page.locator("#popover-bottom [slot='trigger']").click()
  const events = await page
    .locator('#popover-bottom [data-slot="panel"]')
    .evaluate((el) => getComputedStyle(el).pointerEvents)
  expect(events).not.toBe("none")
})

test("the start placement is logical, so it mirrors in rtl", async ({ page }) => {
  // ADR-016: `start` and `end` are logical. Measured rather than read from the
  // attribute, because a physical `left` would also report "start".
  const trigger = page.locator("#popover-start [slot='trigger']")
  await trigger.click()
  const panel = page.locator('#popover-start [data-slot="panel"]')

  const ltr = await panel.boundingBox()
  const triggerLtr = await trigger.boundingBox()
  // In LTR, `start` is the left side: the panel sits before the trigger.
  expect(ltr!.x).toBeLessThan(triggerLtr!.x)

  await page.keyboard.press("Escape")
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
  await trigger.click()
  const rtl = await panel.boundingBox()
  const triggerRtl = await trigger.boundingBox()
  // In RTL it mirrors: the panel is now after the trigger.
  expect(rtl!.x).toBeGreaterThan(triggerRtl!.x)
})
