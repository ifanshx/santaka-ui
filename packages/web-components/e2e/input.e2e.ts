import { expect, test, type Page } from "@playwright/test"

/**
 * Input browser tests.
 *
 * An input is the one component where form participation *is* the feature, so
 * most of these assert things a jsdom test cannot: that a plain `<form>` submits
 * the value, that a form reset restores it, that a disabled field is excluded
 * from the submission, and that the browser's own constraint validation reaches
 * the FACE's `setValidity`. Every assertion here is about behavior the custom
 * element owns.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Append a form containing one `sk-input`, and wait for the element to upgrade
 * and render its native `<input>`.
 *
 * The markup is built by assigning `innerHTML` rather than by
 * `document.createElement("sk-input")`: a created custom element only upgrades
 * if its definition has already run, which inside one `page.evaluate` it has not.
 * Parsing goes through the fragment parser, which upgrades synchronously.
 *
 * Each call gets a unique form id, because the example page already has a form
 * of its own and a shared selector would match both.
 */
let probeCount = 0

async function mountField(page: Page, attrs: Record<string, string>) {
  const id = `probe-${++probeCount}`

  await page.evaluate(
    ({ formId, a }) => {
      const wrapper = document.createElement("div")
      const encoded = Object.entries(a)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ")
      wrapper.innerHTML = `<form id="${formId}"><sk-input ${encoded}></sk-input></form>`
      document.body.appendChild(wrapper.firstElementChild as HTMLFormElement)
    },
    { formId: id, a: attrs },
  )

  const form = page.locator(`#${id}`)
  const control = form.locator("input[data-slot='control']")
  // Waiting for the inner input is the real signal that the element upgraded.
  await expect(control).toHaveCount(1)
  return { id, field: form.locator("sk-input"), control, form }
}

/** What a submission of the mounted field carries, read via `FormData`. */
async function submitted(page: Page, formId: string, name: string) {
  return page.evaluate(
    ({ selector, fieldName }) => {
      const data = new FormData(document.querySelector(selector) as HTMLFormElement)
      return { has: data.has(fieldName), value: String(data.get(fieldName) ?? "") }
    },
    { selector: `#${formId}`, fieldName: name },
  )
}

test("renders a real native input, not a div with a textbox role", async ({ page }) => {
  const field = page.locator("sk-input#example-name")
  await expect(field).toBeVisible()

  // A real `<input>` is what makes native validation, password managers,
  // autofill, and IME composition work. None of that can be reimplemented.
  const control = field.locator("input[data-slot='control']")
  await expect(control).toHaveCount(1)
  expect(await control.evaluate((el) => el.tagName)).toBe("INPUT")
  expect(await control.evaluate((el) => el.getAttribute("role"))).toBeNull()
})

test("submits its value through a plain form", async ({ page }) => {
  const { id } = await mountField(page, { name: "username", value: "ada" })
  const result = await submitted(page, id, "username")
  expect(result.has).toBe(true)
  expect(result.value).toBe("ada")
})

test("updates the submitted value as the user types", async ({ page }) => {
  const { id, control } = await mountField(page, { name: "username", value: "ada" })
  await control.fill("grace")
  const result = await submitted(page, id, "username")
  expect(result.value).toBe("grace")
})

test("a disabled field is excluded from the submission", async ({ page }) => {
  const { id } = await mountField(page, { name: "secret", value: "hidden", disabled: "" })
  // A field that submits after being disabled corrupts the submission; the form
  // contract requires the value be withheld.
  expect((await submitted(page, id, "secret")).has).toBe(false)
})

test("a form reset returns the field to its initial value", async ({ page }) => {
  const { control, form } = await mountField(page, { name: "code", value: "initial" })
  expect(await control.inputValue()).toBe("initial")

  await control.fill("typed over")
  await form.evaluate((el: HTMLFormElement) => el.reset())

  expect(await control.inputValue()).toBe("initial")
})

test("a read-only field is still submitted, unlike a disabled one", async ({ page }) => {
  const { id, control } = await mountField(page, {
    name: "accountId",
    value: "acc_01H8XK2",
    readonly: "",
  })

  const result = await submitted(page, id, "accountId")
  expect(result.value).toBe("acc_01H8XK2")
  expect(await control.evaluate((el) => (el as HTMLInputElement).readOnly)).toBe(true)
  // A read-only field stays focusable, which is the whole difference from
  // disabled: the value must not be editable but must still be reachable.
  expect(await control.evaluate((el) => (el as HTMLInputElement).tabIndex)).toBeGreaterThanOrEqual(
    0,
  )
})

test("required is enforced natively rather than by this component", async ({ page }) => {
  const { control } = await mountField(page, { name: "email", type: "email", required: "" })
  const state = await control.evaluate((el) => {
    const input = el as HTMLInputElement
    return {
      required: input.required,
      missing: input.validity.valueMissing,
      valid: input.validity.valid,
    }
  })
  expect(state.required).toBe(true)
  expect(state.missing).toBe(true)
  expect(state.valid).toBe(false)
})

test("a pattern constraint reaches the browser's own validation", async ({ page }) => {
  const { control } = await mountField(page, { name: "code", pattern: "[0-9]{4}", value: "abcd" })
  const state = await control.evaluate((el) => {
    const input = el as HTMLInputElement
    return { mismatch: input.validity.patternMismatch, valid: input.validity.valid }
  })
  expect(state.mismatch).toBe(true)
  expect(state.valid).toBe(false)
})

test("an error sets aria-invalid and is described by the error element", async ({ page }) => {
  const field = page.locator("sk-input#example-error")
  const control = field.locator("input[data-slot='control']")

  await expect(control).toHaveAttribute("aria-invalid", "true")
  await expect(field).toHaveAttribute("data-invalid", "")

  const describedBy = await control.getAttribute("aria-describedby")
  expect(describedBy).toBeTruthy()

  // The id must resolve to an element that actually exists, or the reference is a
  // dead string and a screen reader announces nothing.
  const errorId = await field.locator('[data-slot="error"]').getAttribute("id")
  expect(describedBy).toContain(errorId ?? "")
  await expect(field.locator('[data-slot="error"]')).toBeVisible()
})

test("an error is never conveyed by color alone (WCAG 1.4.1)", async ({ page }) => {
  const error = page.locator('sk-input#example-error [data-slot="error"]')
  // Icon plus text, not just a red border.
  await expect(error.locator('[data-slot="error-icon"]')).toHaveCount(1)
  await expect(error).toContainText("already taken")
})

test("description is wired through aria-describedby, and yields to an error", async ({ page }) => {
  const withDescription = page.locator("sk-input#example-name")
  const control = withDescription.locator("input[data-slot='control']")
  const descriptionId = await withDescription
    .locator('[data-slot="description"]')
    .getAttribute("id")
  expect(await control.getAttribute("aria-describedby")).toContain(descriptionId ?? "")

  // An error takes precedence: showing both reads as two messages about one
  // field, and the description is the less urgent of the two.
  const withError = page.locator("sk-input#example-error")
  await expect(withError.locator('[data-slot="description"]')).toHaveCount(0)
  await expect(withError.locator('[data-slot="error"]')).toHaveCount(1)
})

test("the label is associated with the input through htmlFor", async ({ page }) => {
  const field = page.locator("sk-input#example-name")
  const labelFor = await field.locator('[data-slot="label"]').getAttribute("for")
  const controlId = await field.locator("input[data-slot='control']").getAttribute("id")
  expect(labelFor).toBeTruthy()
  expect(labelFor).toBe(controlId)
})

test("clicking the label focuses the input", async ({ page }) => {
  await page.locator('sk-input#example-name [data-slot="label"]').click()
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("INPUT")
})

/** Mark the field when a change event arrives, on the element itself. */
async function watchChanges(page: Page, id: string) {
  await page.evaluate((formId) => {
    const field = document.querySelector(`#${formId} sk-input`)
    field?.addEventListener("sk-value-change", () => {
      const next = Number(field.getAttribute("data-change-count") ?? "0") + 1
      field.setAttribute("data-change-count", String(next))
    })
  }, id)
}

test("emits sk-value-change for user input", async ({ page }) => {
  const { id, control } = await mountField(page, { name: "username" })
  await watchChanges(page, id)

  // `fill` dispatches `input`; `change` is what the component reports on.
  await control.fill("typed")
  await control.dispatchEvent("change")

  await expect(page.locator(`#${id} sk-input`)).toHaveAttribute("data-change-count", "1")
})

test("a programmatic value assignment does not fire a change event", async ({ page }) => {
  const { id, control } = await mountField(page, { name: "username", value: "start" })
  await watchChanges(page, id)

  // Section 4: a change event fires only for user-initiated changes, which is
  // what keeps a controlled component from looping on its own update. Assigning
  // `value` from outside the control updates the field and the form but reports
  // nothing, because the assignment dispatches no `input` or `change` event.
  await page.evaluate((formId) => {
    const field = document.querySelector(`#${formId} sk-input`) as { value: string }
    field.value = "set programmatically"
  }, id)

  await expect(control).toHaveValue("set programmatically")
  await expect(page.locator(`#${id} sk-input`)).not.toHaveAttribute("data-change-count", "1")

  // The value still reached the form, which is the part that must not regress.
  expect((await submitted(page, id, "username")).value).toBe("set programmatically")
})

test("is keyboard focusable and meets the 44px target", async ({ page }) => {
  const { control } = await mountField(page, { name: "username" })
  await control.focus()
  await expect(control).toBeFocused()

  const box = await control.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return { height: rect.height, width: rect.width }
  })
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.width).toBeGreaterThanOrEqual(44)
})

test("carries the brutalist treatment like every other chrome component", async ({ page }) => {
  const { control } = await mountField(page, { name: "username" })
  const style = await control.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      borderWidth: cs.borderTopWidth,
      radius: cs.borderTopLeftRadius,
      boxShadow: cs.boxShadow,
    }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.radius, "chrome takes its radius from --sk-radius-md").toBe(
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--sk-radius-md").trim()),
  )
  expect(style.boxShadow).not.toBe("none")
  expect(style.boxShadow).toMatch(/px 0px/)
})

test("an invalid field changes its stroke", async ({ page }) => {
  const invalid = await page
    .locator('sk-input#example-error input[data-slot="control"]')
    .evaluate((el) => getComputedStyle(el).borderTopColor)
  const valid = await page
    .locator('sk-input#example-name input[data-slot="control"]')
    .evaluate((el) => getComputedStyle(el).borderTopColor)
  expect(invalid).not.toBe(valid)
})

test("exposes documented state attributes", async ({ page }) => {
  for (const id of ["example-name", "example-readonly", "example-disabled"]) {
    await expect(page.locator(`sk-input#${id}`)).toHaveAttribute("data-slot", "field")
  }
  await expect(page.locator("sk-input#example-error")).toHaveAttribute("data-invalid", "")
})

test("follows the theme", async ({ page }) => {
  const read = () =>
    page
      .locator('sk-input#example-name input[data-slot="control"]')
      .evaluate((el) => getComputedStyle(el).borderTopColor)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()
  expect(dark).not.toBe(light)
})
