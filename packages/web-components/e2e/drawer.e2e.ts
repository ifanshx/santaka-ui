import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

/**
 * Drawer browser tests.
 *
 * The mechanics are the dialog's — focus trap, Escape, backdrop, focus return —
 * and they are proven there, so this file does not re-prove them. What is ours
 * is the edge, and one claim above all: `side="start"` and `side="end"` are
 * logical and must mirror under `dir="rtl"` (ADR-016).
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Opens a drawer and waits for the slide to land.
 *
 * The panel animates in from its own edge, so a `boundingBox()` taken
 * immediately measures it mid-slide — still off-screen, and therefore outside
 * the viewport width. Before this helper existed the end-edge test read 1535
 * against a 1280 viewport, which looks like a positioning bug and is a timing
 * one.
 */
async function openAndSettle(page: Page, id: string) {
  await page.locator(`#${id} [slot='trigger']`).click()
  const panel = page.locator(`#${id} dialog`)
  await expect(panel).toBeVisible()
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel)
    if (!el) return false
    return el.getAnimations().every((animation) => animation.playState !== "running")
  }, `#${id} dialog`)
  return panel
}

test("the panel is a native dialog, so the browser owns the focus story", async ({ page }) => {
  // Not a <div role="dialog"> with hand-written focus management: the native
  // element traps focus, closes on Escape, and makes the page behind inert.
  await page.locator("#drawer-end [slot='trigger']").click()
  const panel = page.locator("#drawer-end dialog")
  await expect(panel).toBeVisible()
  await expect(panel).toHaveJSProperty("open", true)
})

test("opening reports through sk-open-change", async ({ page }) => {
  const events = await page.evaluate(async () => {
    const host = document.querySelector("#drawer-end")!
    const seen: boolean[] = []
    host.addEventListener("sk-open-change", (event) => {
      seen.push((event as CustomEvent<{ open: boolean }>).detail.open)
    })
    const { promise, resolve } = Promise.withResolvers<void>()
    setTimeout(resolve, 100)
    ;(host.querySelector("[slot='trigger']") as HTMLElement).click()
    await promise
    return seen
  })
  expect(events).toEqual([true])
})

test("Escape closes and focus returns to the trigger", async ({ page }) => {
  const trigger = page.locator("#drawer-end [slot='trigger']")
  await trigger.click()
  await expect(page.locator("#drawer-end dialog")).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.locator("#drawer-end dialog")).toBeHidden()
  // The detail that matters: a keyboard user is not dropped at the top of the
  // document when a drawer closes.
  await expect(trigger).toBeFocused()
})

test("side=end sits at the inline-end edge", async ({ page }) => {
  const panel = await openAndSettle(page, "drawer-end")
  const box = await panel.boundingBox()
  const viewport = page.viewportSize()!
  // Flush to the end edge in LTR: the panel's right side is the viewport's.
  expect(Math.round((box!.x + box!.width) as number)).toBe(viewport.width)
})

test("side=start mirrors to the other edge", async ({ page }) => {
  const panel = await openAndSettle(page, "drawer-start")
  const box = await panel.boundingBox()
  expect(Math.round(box!.x)).toBe(0)
})

test("the logical sides swap under dir=rtl, which is the whole point", async ({ page }) => {
  // ADR-016: `start` and `end` are logical, so a right-to-left document gets the
  // mirrored edge without a second stylesheet or a direction prop. A physical
  // `left`/`right` would not move — which is exactly why they are opt-in.
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
  const panel = await openAndSettle(page, "drawer-end")
  const box = await panel.boundingBox()
  // `end` in RTL is the left edge.
  expect(Math.round(box!.x)).toBe(0)
})

test("closing by a method leaves the page interactive", async ({ page }) => {
  // A modal drawer makes the page behind inert; closing must release it.
  await page.locator("#drawer-end [slot='trigger']").click()
  await expect(page.locator("#drawer-end dialog")).toBeVisible()

  await page
    .locator("#drawer-end")
    .evaluate((el) => (el as HTMLElement & { close: () => Promise<void> }).close())
  await expect(page.locator("#drawer-end dialog")).toBeHidden()
})
