import { expect, test } from "@playwright/test"

/**
 * Combobox browser tests.
 *
 * The ARIA 1.2 combobox pattern is the subject: focus must never leave the input,
 * and the active option is reported through `aria-activedescendant`. Moving focus
 * into the list is the common mistake — it blurs the field the reader is typing
 * into and every screen reader announces it as leaving.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("the input is a combobox that controls a listbox", async ({ page }) => {
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await expect(input).toHaveAttribute("role", "combobox")
  await expect(input).toHaveAttribute("aria-expanded", "false")

  const controls = await input.getAttribute("aria-controls")
  expect(controls).toBeTruthy()
  // `aria-controls` must name an element that is actually a listbox.
  await expect(page.locator(`#${controls}`)).toHaveAttribute("role", "listbox")
})

test("opening reflects aria-expanded", async ({ page }) => {
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  await input.type("ja")
  await expect(input).toHaveAttribute("aria-expanded", "true")
  await expect(page.locator('#combobox-basic [data-slot="listbox"]')).toBeVisible()
})

test("typing filters the options", async ({ page }) => {
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  await input.type("ja")
  // Only Japan matches "ja" among the four options.
  await expect(page.locator('#combobox-basic [role="option"]')).toHaveCount(1)
  await expect(page.locator('#combobox-basic [role="option"]')).toHaveText("Japan")
})

test("arrows move the active option without moving focus", async ({ page }) => {
  // The assertion that matters: focus stays in the input while the active option
  // changes. That is what `aria-activedescendant` is for, and moving focus would
  // break it.
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()

  await page.keyboard.press("ArrowDown")
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-activedescendant", "combobox-basic-option-0")

  await page.keyboard.press("ArrowDown")
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-activedescendant", "combobox-basic-option-1")

  await page.keyboard.press("ArrowUp")
  await expect(input).toHaveAttribute("aria-activedescendant", "combobox-basic-option-0")
})

test("aria-activedescendant names an option that exists", async ({ page }) => {
  // An id that points at nothing is worse than no id: the reader reports an
  // active option that is not in the list.
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  await page.keyboard.press("ArrowDown")

  // Waited for, not read immediately. `activeIndex` is @State, so
  // `aria-activedescendant` lands on the *next* render — reading it straight
  // after the keypress races that render and saw null about half the time. This
  // looked like a flake and is a timing bug in the test, not in the component:
  // retrying would have hidden it, which is why the accordion flakes in ADR-019
  // were fixed at their cause instead.
  await expect(input).toHaveAttribute("aria-activedescendant", /.+/)
  const active = await input.getAttribute("aria-activedescendant")
  await expect(page.locator(`#${active}`)).toHaveAttribute("role", "option")
})

test("arrows wrap rather than dead-ending", async ({ page }) => {
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  // Four options; up from the first lands on the last.
  await page.keyboard.press("ArrowUp")
  await expect(input).toHaveAttribute("aria-activedescendant", "combobox-basic-option-3")
})

test("Enter commits the active option and closes", async ({ page }) => {
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")

  // Committed: the field shows the label, the value attribute is the option's.
  await expect(input).toHaveValue("Indonesia")
  await expect(page.locator("#combobox-basic")).toHaveAttribute("value", "id")
  await expect(page.locator('#combobox-basic [data-slot="listbox"]')).toBeHidden()
})

test("a committed selection emits sk-value-change", async ({ page }) => {
  const events = await page.evaluate(async () => {
    const host = document.querySelector("#combobox-basic")!
    const seen: string[] = []
    host.addEventListener("sk-value-change", (event) => {
      seen.push((event as CustomEvent<{ value: string }>).detail.value)
    })
    const input = host.querySelector("input") as HTMLInputElement
    input.focus()
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    return seen
  })
  expect(events).toEqual(["id"])
})

test("Escape closes without clearing the typed text", async ({ page }) => {
  // Closing and reverting are different commands; the reader's typed text is
  // their work.
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  await input.type("ja")
  await expect(page.locator('#combobox-basic [data-slot="listbox"]')).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.locator('#combobox-basic [data-slot="listbox"]')).toBeHidden()
  await expect(input).toHaveValue("ja")
})

test("an empty result says so, and is not an option", async ({ page }) => {
  const input = page.locator('#combobox-basic [data-slot="control"] input')
  await input.click()
  await input.type("zzz")
  await expect(page.locator('#combobox-basic [role="option"]')).toHaveCount(0)
  await expect(page.locator('#combobox-basic [data-slot="empty"]')).toBeVisible()
})

test("the error is announced and carries a glyph", async ({ page }) => {
  // Appended, not replacing: description and error join. And a glyph, so the
  // error is not colour alone (WCAG 1.4.1).
  const input = page.locator('#combobox-error [data-slot="control"] input')
  await expect(input).toHaveAttribute("aria-invalid", "true")
  const describedBy = await input.getAttribute("aria-describedby")
  expect(describedBy).toContain("combobox-error-error")
  await expect(
    page.locator('#combobox-error [data-slot="error"] [aria-hidden="true"]'),
  ).toHaveCount(1)
})
