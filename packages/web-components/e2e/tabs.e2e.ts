import { expect, test, type Locator, type Page } from "@playwright/test"

/**
 * Tabs browser tests.
 *
 * The ARIA tabs pattern's hard rule is the test surface: the tablist owns the
 * keyboard (roving tabindex — exactly one tab stop), arrows move AND activate,
 * Home/End jump, activation wraps, and the state attributes (`aria-selected`,
 * `aria-controls`, `aria-labelledby`, `hidden`) are written by the widget
 * because tabs and panels are separately slotted. RTL inversion is asserted
 * directly: `dir="rtl"` must flip the arrow meaning at interaction time.
 *
 * Elements are mounted from attribute strings, never from an upgraded
 * element's `outerHTML` — the serialized DOM already contains rendered
 * output, and re-upgrading renders a second control (the Dialog/Select
 * lesson). The upgrade signal here is the widget's `data-slot="tabs"` host
 * plus a tab button existing.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const MOUNT = (id: string, rtl = false) => `
<div id="${id}" ${rtl ? 'dir="rtl"' : ""}>
  <sk-tabs id="${id}-tabs">
    <div slot="tablist" data-slot="tablist">
      <sk-tab label="Account"></sk-tab>
      <sk-tab label="Billing"></sk-tab>
      <sk-tab label="Team"></sk-tab>
    </div>
    <sk-tab-panel><p>Panel A</p></sk-tab-panel>
    <sk-tab-panel><p>Panel B</p></sk-tab-panel>
    <sk-tab-panel><p>Panel C</p></sk-tab-panel>
  </sk-tabs>
</div>`

async function mount(page: Page, id: string, rtl = false) {
  await page.evaluate(
    (html) => {
      const wrapper = document.createElement("div")
      wrapper.innerHTML = html
      document.body.appendChild(wrapper)
    },
    MOUNT(id, rtl),
  )
  const scope = page.locator(`#${id} sk-tabs`)
  // Hydration is async: the widget's sync pass (which writes aria-selected,
  // tabindex, and data-state) runs in componentDidLoad. Waiting only for the
  // buttons to exist can race the keydown listener into place — keyboard
  // tests must wait for the sync pass's own output.
  await expect(scope.locator("sk-tab[data-state='active']")).toHaveCount(1)
  return scope
}

// The host is the button now: no inner button element (a button inside a
// role=tab is a nested-interactive violation). Clicks and focus land on it.
const tab = (scope: Locator, i: number) => scope.locator(`[data-slot='tab']`).nth(i)

// The widget writes the roving tabindex on the sk-tab *host*; the inner
// template button is tabindex=-1 by design so exactly one element — the
// active tab's host — is the tab stop. Keyboard assertions read the host.
const tabHost = (scope: Locator, i: number) => scope.locator(`sk-tab[data-slot='tab']`).nth(i)

test("only the active tab is a tab stop (roving tabindex)", async ({ page }) => {
  const scope = await mount(page, "tabs-roving")
  expect(await tabHost(scope, 0).getAttribute("tabindex")).toBe("0")
  expect(await tabHost(scope, 1).getAttribute("tabindex")).toBe("-1")
  expect(await tabHost(scope, 2).getAttribute("tabindex")).toBe("-1")
})

test("arrow keys move AND activate (automatic activation)", async ({ page }) => {
  const scope = await mount(page, "tabs-arrows")
  await tabHost(scope, 0).focus()
  await page.keyboard.press("ArrowRight")
  await expect.poll(async () => scope.getAttribute("active")).toBe("1")
  await expect(tabHost(scope, 1)).toBeFocused()
  // Panel B revealed, Panel A removed from the tree via `hidden`.
  await expect(scope.locator("[data-slot='panel']").nth(1)).toBeVisible()
  await expect(scope.locator("[data-slot='panel']").nth(0)).toBeHidden()
  await page.keyboard.press("ArrowLeft")
  await expect.poll(async () => scope.getAttribute("active")).toBe("0")
})

test("Home and End jump to the ends", async ({ page }) => {
  const scope = await mount(page, "tabs-ends")
  await tabHost(scope, 0).focus()
  await page.keyboard.press("End")
  await expect.poll(async () => scope.getAttribute("active")).toBe("2")
  await page.keyboard.press("Home")
  await expect.poll(async () => scope.getAttribute("active")).toBe("0")
})

test("activation wraps at both ends", async ({ page }) => {
  const scope = await mount(page, "tabs-wrap")
  await tabHost(scope, 0).focus()
  await page.keyboard.press("ArrowLeft")
  await expect.poll(async () => scope.getAttribute("active")).toBe("2")
  await page.keyboard.press("ArrowRight")
  await expect.poll(async () => scope.getAttribute("active")).toBe("0")
})

test("click activates without moving activation twice", async ({ page }) => {
  const scope = await mount(page, "tabs-click")
  await tab(scope, 2).click()
  await expect.poll(async () => scope.getAttribute("active")).toBe("2")
  await expect(tab(scope, 2)).toBeFocused()
})

test("aria-selected, aria-controls, and aria-labelledby are wired", async ({ page }) => {
  const scope = await mount(page, "tabs-aria")
  // State attributes are written on the sk-tab host, per the probe.
  const selectedTab = tabHost(scope, 0)
  expect(await selectedTab.getAttribute("aria-selected")).toBe("true")
  const controls = await selectedTab.getAttribute("aria-controls")
  expect(controls).toBeTruthy()
  const panel = scope.locator(`[data-slot='panel']#${controls}`)
  await expect(panel).toBeVisible()
  expect(await panel.getAttribute("aria-labelledby")).toBeTruthy()
  expect(await tabHost(scope, 1).getAttribute("aria-selected")).toBe("false")
})

test("sk-tab-change fires with the new index", async ({ page }) => {
  const scope = await mount(page, "tabs-event")
  // The event name is kebab-case like every other component event. Recorded on
  // window (no exposeFunction round-trip) so the click below is the only
  // moving part.
  await page.evaluate(() => {
    ;(window as unknown as { __tabChanges: number[] }).__tabChanges = []
    document
      .querySelector("#tabs-event-tabs")!
      .addEventListener("sk-tab-change", (e) =>
        (window as unknown as { __tabChanges: number[] }).__tabChanges.push(
          (e as CustomEvent).detail.index,
        ),
      )
  })
  await tab(scope, 1).click()
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __tabChanges: number[] }).__tabChanges))
    .toEqual([1])
})

test("RTL inverts the arrow meaning at interaction time", async ({ page }) => {
  const scope = await mount(page, "tabs-rtl", true)
  await tabHost(scope, 0).focus()
  // Under dir="rtl", ArrowRight means previous (§4: derived from
  // getComputedStyle at interaction time, never a build flag).
  await page.keyboard.press("ArrowRight")
  await expect.poll(async () => scope.getAttribute("active")).toBe("2")
  await page.keyboard.press("ArrowLeft")
  await expect.poll(async () => scope.getAttribute("active")).toBe("0")
})

test("panels are hidden, not just visually inactive", async ({ page }) => {
  const scope = await mount(page, "tabs-hidden")
  expect(
    await scope
      .locator("[data-slot='panel']")
      .nth(2)
      .evaluate((el) => el.hidden),
  ).toBe(true)
  await tab(scope, 2).click()
  expect(
    await scope
      .locator("[data-slot='panel']")
      .nth(2)
      .evaluate((el) => el.hidden),
  ).toBe(false)
})
