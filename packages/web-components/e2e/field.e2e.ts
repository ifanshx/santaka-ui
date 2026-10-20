import { expect, test } from "@playwright/test"

/**
 * Field browser tests.
 *
 * The component's whole contract is ARIA wiring that no screenshot shows: the
 * attributes have to land on the *control* — which the consumer supplied, not
 * this component — and the error must join the description rather than silence
 * it. Every test below is one of those.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("the label is associated with the control by id", async ({ page }) => {
  // The control is the consumer's, so wrapping it in a <label> would make the
  // association indirect. `aria-labelledby` states it on the element that is
  // actually announced.
  const control = page.locator("#field-plain-input")
  const labelId = await control.getAttribute("aria-labelledby")
  expect(labelId).toBe("field-plain-label")

  const label = page.locator(`#${labelId}`)
  await expect(label).toHaveText("Workspace name")
})

test("the description is announced through aria-describedby", async ({ page }) => {
  const control = page.locator("#field-plain-input")
  await expect(control).toHaveAttribute("aria-describedby", "field-plain-description")

  const description = page.locator("#field-plain-description")
  await expect(description).toHaveText("Lowercase letters and dashes.")
})

test("the error joins the description rather than replacing it", async ({ page }) => {
  // §4: the error id is appended to any existing description. An error that
  // silences the hint removes the format instruction exactly when the user needs
  // it — which is the bug this assertion exists to catch.
  const control = page.locator("#field-error-input")
  const describedBy = await control.getAttribute("aria-describedby")
  expect(describedBy).toContain("field-error-description")
  expect(describedBy).toContain("field-error-error")

  await expect(control).toHaveAttribute("aria-invalid", "true")
})

test("invalid without an error message still marks the control", async ({ page }) => {
  // The two are separate props: a field can be invalid before the consumer knows
  // why.
  await expect(page.locator("#field-invalid-input")).toHaveAttribute("aria-invalid", "true")
  await expect(page.locator("#field-invalid-input")).not.toHaveAttribute(
    "aria-describedby",
    /error/,
  )
})

test("required is announced on the control, not only drawn on the label", async ({ page }) => {
  await expect(page.locator("#field-required-input")).toHaveAttribute("aria-required", "true")

  // The asterisk is the visual signal and is hidden; the word is what is
  // announced, so a reader hears "required" rather than a symbol.
  const required = page.locator('#field-required [data-slot="required"]')
  await expect(required.locator('[aria-hidden="true"]')).toHaveText("*")
  await expect(required).toContainText("required")
})

test("the error carries a glyph so colour is not the only signal", async ({ page }) => {
  // WCAG 1.4.1. The glyph is empty and hidden; the text beside it is the message.
  const icon = page.locator('#field-error [data-slot="error"] [aria-hidden="true"]')
  await expect(icon).toHaveCount(1)
  await expect(page.locator('#field-error [data-slot="error"]')).toContainText(
    "That name is already taken.",
  )
})

test("the field never touches the control's value, name, or disabled state", async ({ page }) => {
  // It describes; it does not control. These three are the control's own
  // business and a wrapper that set them would be a second owner of the value.
  const control = page.locator("#field-plain-input")
  await expect(control).toHaveAttribute("name", "workspace")
  await expect(control).toHaveAttribute("type", "text")
  await expect(control).not.toHaveAttribute("disabled")
  await expect(control).toHaveJSProperty("value", "")
})

test("a field with no control renders its label without breaking", async ({ page }) => {
  // The consumer may slot the control later, or conditionally. A null control is
  // a normal state, not an error.
  const empty = page.locator("#field-empty")
  await expect(empty).toBeVisible()
  await expect(empty.locator('[data-slot="label"]')).toHaveText("No control yet")
})

test("the field draws no chrome of its own", async ({ page }) => {
  // A box around a control that already has one reads as two nested inputs.
  const border = await page
    .locator("#field-plain")
    .evaluate((el) => getComputedStyle(el).borderTopWidth)
  expect(border).toBe("0px")
})
