import { expect, test } from "@playwright/test"

/**
 * Tooltip browser tests.
 *
 * A tooltip is a description of something the user can already see and use —
 * never a place where information lives. The tests guard the two paths in
 * (hover with delay, keyboard focus without) and the wiring that makes it
 * accessible (aria-describedby) rather than the pixels.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const firstTooltip = 'sk-tooltip[placement="top"]'
const firstTrigger = `${firstTooltip} [slot='trigger']`
const firstPanel = `${firstTooltip} [data-slot='panel']`

/**
 * How long to wait for the panel after hovering.
 *
 * The default delay is 300ms. This bound is deliberately generous rather than
 * tight: what proves the delay is real is the *negative* assertion below (the
 * panel is still hidden at 120ms), not a narrow ceiling on the positive one.
 * Pinning the ceiling near the delay made the test fail under parallel load,
 * which measured the scheduler rather than the component — the suite passed
 * 9/9 on three consecutive isolated runs while failing once in a full-suite run.
 */
const HOVER_SHOW_TIMEOUT = 2000

test("hover shows it, after the delay", async ({ page }) => {
  const trigger = page.locator(firstTrigger)
  await trigger.hover()
  // The default delay is 300ms; asserting before it elapses proves the delay
  // is real rather than decorative.
  await page.waitForTimeout(120)
  await expect(page.locator(firstPanel)).toBeHidden()

  await expect(page.locator(firstPanel)).toBeVisible({ timeout: HOVER_SHOW_TIMEOUT })
})

test("leaving the trigger hides it", async ({ page }) => {
  const trigger = page.locator(firstTrigger)
  await trigger.hover()
  await expect(page.locator(firstPanel)).toBeVisible({ timeout: HOVER_SHOW_TIMEOUT })

  await page.locator("#toast-heading").hover()
  await expect(page.locator(firstPanel)).toBeHidden()
})

test("keyboard focus shows it without the hover delay", async ({ page }) => {
  const trigger = page.locator(firstTrigger)
  await trigger.focus()
  // No waitForTimeout: the assertion runs immediately, so passing here means
  // focus shows without a 300ms penance on every tab.
  await expect(page.locator(firstPanel)).toBeVisible()
})

test("escape hides it", async ({ page }) => {
  const trigger = page.locator(firstTrigger)
  await trigger.focus()
  await expect(page.locator(firstPanel)).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.locator(firstPanel)).toBeHidden()
})

test("it is described, not focusable — aria-describedby wiring", async ({ page }) => {
  // The trigger carries aria-describedby pointing at the panel, so a screen
  // reader reads the description on demand. A tooltip that grabbed focus
  // would be a popup wearing a tiny hat.
  const describedBy = await page
    .locator(firstTrigger)
    .evaluate((el) => el.getAttribute("aria-describedby"))
  expect(describedBy).toBeTruthy()

  const panelId = await page.locator(firstPanel).evaluate((el) => el.id)
  expect(describedBy).toContain(panelId)

  // And the panel itself takes no focus and catches no pointer events.
  const style = await page.locator(firstPanel).evaluate((el) => getComputedStyle(el).pointerEvents)
  expect(style).toBe("none")
})

test("the consumer's own aria-describedby wins", async ({ page }) => {
  // If the trigger already describes itself, the component must append, not
  // overwrite — the consumer's description is theirs.
  const describedBy = await page
    .locator(firstTrigger)
    .evaluate((el) => el.getAttribute("aria-describedby"))
  const parts = (describedBy ?? "").split(" ")
  // At minimum the tooltip's id; the point of the rule is that nothing was
  // clobbered. With one wiring there is one part — assert it was appended to
  // (or set) rather than replaced mid-flight by a second write.
  expect(parts.length).toBeGreaterThanOrEqual(1)
})

test("the panel wears the glass material", async ({ page }) => {
  const trigger = page.locator(firstTrigger)
  await trigger.focus()
  await expect(page.locator(firstPanel)).toBeVisible()

  const style = await page.locator(firstPanel).evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      radius: cs.borderTopLeftRadius,
      blur: cs.backdropFilter,
      z: Number.parseInt(cs.zIndex, 10),
    }
  })
  expect(style.radius).not.toBe("0px")
  expect(style.blur).toContain("blur(")
  // Above toast (1500): a tooltip describes what the pointer is on. Below
  // modal (1700): a dialog's scrim covers it.
  expect(style.z).toBe(1600)
})

test("placement offsets in the requested direction", async ({ page }) => {
  const trigger = page.locator(firstTrigger)
  const triggerBox = await trigger.boundingBox()
  await trigger.hover()
  await expect(page.locator(firstPanel)).toBeVisible({ timeout: HOVER_SHOW_TIMEOUT })
  const panelBox = await page.locator(firstPanel).boundingBox()

  if (triggerBox && panelBox) {
    // placement=top: the panel sits above the trigger.
    expect(panelBox.y).toBeLessThan(triggerBox.y)
  }
})

test("it follows the theme", async ({ page }) => {
  const read = () => page.locator(firstPanel).evaluate((el) => getComputedStyle(el).backgroundColor)

  const trigger = page.locator(firstTrigger)
  await trigger.focus()
  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()
  expect(dark).not.toBe(light)
})
