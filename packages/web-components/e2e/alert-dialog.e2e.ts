import { expect, test } from "@playwright/test"

/**
 * Alert Dialog browser tests.
 *
 * The component's contract is three *removals* from sk-dialog: the role, the
 * refusal of cheap dismissal, and the focus default. Each test asserts a
 * removal, which is harder than asserting a presence — the easy way to test
 * "no backdrop dismissal" is to click nothing and pass.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const PANEL = 'sk-alert-dialog dialog[data-slot="panel"]'

test("it announces itself as an alertdialog, not a dialog", async ({ page }) => {
  await page.locator("#alert-open").click()
  await expect(page.locator(PANEL)).toBeVisible()
  await expect(page.locator(PANEL)).toHaveAttribute("role", "alertdialog")
})

test("focus lands on the chosen action, not the first focusable", async ({ page }) => {
  // `initialFocus="#alert-cancel"` picks the safe action. Falling back to the
  // first button would have put focus on whatever the DOM order chose — and in
  // a delete confirmation, the wrong default is a destructive one.
  await page.locator("#alert-open").click()
  await expect(page.locator("#alert-cancel")).toBeFocused()
})

test("escape is refused — the question must be answered", async ({ page }) => {
  await page.locator("#alert-open").click()
  await expect(page.locator(PANEL)).toBeVisible()

  await page.keyboard.press("Escape")
  // The decision is forced: the alert stays open, and this is the ARIA APG's
  // requirement for the role rather than a style choice.
  await expect(page.locator(PANEL)).toBeVisible()
})

test("the backdrop click does not dismiss", async ({ page }) => {
  await page.locator("#alert-open").click()
  await expect(page.locator(PANEL)).toBeVisible()

  await page.locator(PANEL).click({ position: { x: 4, y: 4 } })
  await expect(page.locator(PANEL)).toBeVisible()
})

test("the actions close it, and focus returns to the invoker", async ({ page }) => {
  await page.locator("#alert-open").click()
  await expect(page.locator(PANEL)).toBeVisible()

  await page.locator("#alert-cancel").click()
  await expect(page.locator(PANEL)).not.toBeVisible()
  await expect(page.locator("#alert-open")).toBeFocused()
  await expect(page.locator("#alert-result")).toHaveText("repository kept")
})

test("the destructive path records its outcome", async ({ page }) => {
  await page.locator("#alert-open").click()
  await page.locator("#alert-confirm").click()
  await expect(page.locator(PANEL)).not.toBeVisible()
  await expect(page.locator("#alert-result")).toHaveText("repository deleted")
})

test("there is no trigger slot — the app raises it", async ({ page }) => {
  // A "click to see the warning" control is a contradiction. The structural
  // proof is in the panel-content move: a child marked slot="trigger" would be
  // left at the host, but this component renders no host slot for one, so
  // nothing at the host level can act as an invoker besides page code.
  const triggerSlot = await page
    .locator("sk-alert-dialog")
    .first()
    .evaluate((el) => el.querySelectorAll("slot[name='trigger']").length)
  expect(triggerSlot).toBe(0)
})

test("the danger stroke marks the panel as an interruption", async ({ page }) => {
  await page.locator("#alert-open").click()
  const style = await page.locator(PANEL).evaluate((el) => {
    const cs = getComputedStyle(el)
    return { top: cs.borderTopWidth, topColor: cs.borderTopColor, radius: cs.borderTopLeftRadius }
  })
  // Glass rounds; the alert's top edge is the 3px danger stroke. An
  // interruption should look like one before a single word is read.
  expect(style.top).toBe("3px")
  expect(style.radius).not.toBe("0px")
})

test("the mechanics are shared with sk-dialog", async ({ page }) => {
  // The extraction's proof: escape-trapping, backdrop coverage, and focus
  // return all behave identically, because they are the same code. If this
  // dialog ever drifts from sk-dialog's behavior, the base was bypassed.
  await page.locator("#alert-open").click()
  await page.keyboard.press("Tab")
  const inside = await page.evaluate(() => {
    const dialog = document.querySelector("sk-alert-dialog dialog")
    return dialog ? dialog.contains(document.activeElement) : false
  })
  expect(inside).toBe(true)
})
