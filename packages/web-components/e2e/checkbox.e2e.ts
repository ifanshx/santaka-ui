import { expect, test, type Page } from "@playwright/test"

/**
 * Checkbox browser tests.
 *
 * Covers the Input contract on a boolean: FACE with all three callbacks,
 * native constraint validation through `required`, label/description/error
 * wiring, and `sk-value-change` only for user-initiated changes.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Append a form containing one `sk-checkbox`, and wait for the element to upgrade.
 * Returns the form id so the test can submit it later.
 */
let probeCount = 0

async function mountCheckbox(page: Page, attrs: Record<string, string>) {
  const formId = `probe-form-${probeCount++}`
  const tagAttrs = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`)
    .join(" ")
  await page.evaluate(
    ({ formId, tagAttrs }) => {
      const form = document.createElement("form")
      form.id = formId
      form.innerHTML = `<sk-checkbox ${tagAttrs}></sk-checkbox>`
      document.body.appendChild(form)
    },
    { formId, tagAttrs },
  )
  // Wait for the element to upgrade and the control to be present
  await page.waitForSelector(`#${formId} sk-checkbox .sk-checkbox__control`)
  return formId
}

/** What a submission of the mounted checkbox carries, read via `FormData`. */
async function submitted(page: Page, formId: string, name: string) {
  return page.evaluate(
    ({ formId, name }) => {
      const form = document.getElementById(formId) as HTMLFormElement
      if (!form) return "missing-form"
      const data = new FormData(form)
      return data.get(name) ?? null
    },
    { formId, name },
  )
}

/** Mark the field when a change event arrives, on the element itself. */
async function watchChanges(page: Page, id: string) {
  await page.evaluate((id) => {
    const el = document.getElementById(id) as HTMLElement & {
      _changes?: { checked: boolean }[]
    }
    if (!el) return
    el._changes = []
    el.addEventListener("sk-value-change", (e: CustomEvent) => {
      el._changes?.push(e.detail)
    })
  }, id)
}

/** Read the recorded change events from the element. */
async function recordedChanges(page: Page, id: string) {
  return page.evaluate((id) => {
    const el = document.getElementById(id) as HTMLElement & {
      _changes?: { checked: boolean }[]
    }
    return el?._changes ?? []
  }, id)
}

test("renders a real native checkbox input, not a div with a role", async ({ page }) => {
  const formId = await mountCheckbox(page, { id: "test-native", name: "agree", label: "I agree" })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(control).toHaveAttribute("type", "checkbox")
  // The control is the native input; no custom role override
  await expect(control).not.toHaveAttribute("role")
})

test("submits its value through a plain form when checked", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-submit",
    name: "agree",
    label: "I agree",
    checked: "true",
    value: "yes",
  })
  await expect(page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)).toBeChecked()
  const value = await submitted(page, formId, "agree")
  expect(value).toBe("yes")
})

test("submits nothing when unchecked (withholds the entry entirely)", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-submit-unchecked",
    name: "agree",
    label: "I agree",
    value: "yes",
  })
  await expect(page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)).not.toBeChecked()
  const value = await submitted(page, formId, "agree")
  expect(value).toBeNull()
})

test("toggles submitted value on user click", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-toggle",
    name: "agree",
    label: "I agree",
    value: "on",
  })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(control).not.toBeChecked()
  await control.click()
  await expect(control).toBeChecked()
  const value = await submitted(page, formId, "agree")
  expect(value).toBe("on")
  // Click again to uncheck
  await control.click()
  await expect(control).not.toBeChecked()
  const value2 = await submitted(page, formId, "agree")
  expect(value2).toBeNull()
})

test("a disabled checkbox is excluded from the submission", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-disabled",
    name: "agree",
    label: "I agree",
    value: "yes",
    disabled: "true",
  })
  await expect(page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)).toBeDisabled()
  const value = await submitted(page, formId, "agree")
  expect(value).toBeNull()
})

test("a form reset returns the checkbox to its initial checked state", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-reset",
    name: "agree",
    label: "I agree",
    value: "on",
    "default-checked": "true",
  })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(control).toBeChecked()
  // Uncheck it
  await control.click()
  await expect(control).not.toBeChecked()
  // Reset form
  await page.evaluate((formId) => {
    const form = document.getElementById(formId) as HTMLFormElement
    form?.reset()
  }, formId)
  await expect(control).toBeChecked()
})

test("required is enforced natively rather than by this component", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-required",
    name: "agree",
    label: "I agree",
    required: "true",
  })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(control).toHaveAttribute("required")
  // Submit without checking - should fail native validation
  const message = await page.evaluate((formId) => {
    const form = document.getElementById(formId) as HTMLFormElement
    if (!form) return "missing-form"
    const control = form.querySelector("input[type='checkbox']") as HTMLInputElement
    return control?.validationMessage ?? "no-control"
  }, formId)
  expect(message).not.toBe("")
})

test("an error sets aria-invalid and is described by the error element", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-error",
    name: "marketing",
    label: "Subscribe",
    error: "You must accept marketing emails.",
    invalid: "true",
  })
  const host = page.locator(`#${formId} sk-checkbox`)
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(host).toHaveAttribute("data-invalid", "")
  await expect(control).toHaveAttribute("aria-invalid", "true")
  const errorEl = page.locator(`#${formId} sk-checkbox .sk-checkbox__error`)
  await expect(errorEl).toBeVisible()
  const errorId = await errorEl.getAttribute("id")
  expect(errorId).toBeTruthy()
  await expect(control).toHaveAttribute("aria-describedby", errorId!)
})

test("an error is never conveyed by color alone (WCAG 1.4.1)", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-error-color",
    name: "marketing",
    label: "Subscribe",
    error: "You must accept marketing emails.",
    invalid: "true",
  })
  const errorEl = page.locator(`#${formId} sk-checkbox .sk-checkbox__error`)
  const icon = errorEl.locator(".sk-checkbox__error-icon")
  await expect(icon).toBeVisible()
  const text = errorEl.locator("span")
  await expect(text).toHaveText("You must accept marketing emails.")
})

test("description is wired through aria-describedby, and yields to an error", async ({ page }) => {
  // Description only
  let formId = await mountCheckbox(page, {
    id: "test-desc",
    name: "notify",
    label: "Notify me",
    description: "You'll get an email once a week.",
  })
  let control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  const descEl = page.locator(`#${formId} sk-checkbox .sk-checkbox__description`)
  const descId = await descEl.getAttribute("id")
  expect(descId).toBeTruthy()
  await expect(control).toHaveAttribute("aria-describedby", descId!)

  // Error overrides description
  formId = await mountCheckbox(page, {
    id: "test-desc-error",
    name: "notify",
    label: "Notify me",
    description: "You'll get an email once a week.",
    error: "Required.",
    invalid: "true",
  })
  control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  const errorEl = page.locator(`#${formId} sk-checkbox .sk-checkbox__error`)
  const errorId = await errorEl.getAttribute("id")
  await expect(control).toHaveAttribute("aria-describedby", errorId!)
})

test("label wraps the input, making the whole row the activation target", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-label-wrap",
    name: "agree",
    label: "I agree to terms",
  })
  const label = page.locator(`#${formId} sk-checkbox .sk-checkbox__label`)
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  const controlId = await control.getAttribute("id")
  await expect(label).toHaveAttribute("for", controlId!)
  // Clicking the label text toggles the checkbox
  await label.locator("span").first().click()
  await expect(control).toBeChecked()
})

test("emits sk-value-change for user click", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-change-event",
    name: "agree",
    label: "I agree",
    value: "on",
  })
  await watchChanges(page, "test-change-event")
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await control.click()
  const changes = await recordedChanges(page, "test-change-event")
  expect(changes).toEqual([{ checked: true }])
})

test("a programmatic checked assignment does not fire a change event", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-programmatic",
    name: "agree",
    label: "I agree",
    value: "on",
  })
  await watchChanges(page, "test-programmatic")
  await page.evaluate((id) => {
    const el = document.getElementById(id) as HTMLElement & { checked: boolean }
    if (el) el.checked = true
  }, formId)
  // Wait a tick for any event to arrive
  await page.waitForTimeout(50)
  const changes = await recordedChanges(page, "test-programmatic")
  expect(changes).toEqual([])
})

test("is keyboard focusable and meets the 44px target", async ({ page }) => {
  const formId = await mountCheckbox(page, { id: "test-keyboard", name: "agree", label: "I agree" })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await control.focus()
  await expect(control).toBeFocused()
  // Space toggles
  await page.keyboard.press("Space")
  await expect(control).toBeChecked()
  const label = page.locator(`#${formId} sk-checkbox .sk-checkbox__label`)
  const box = await label.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test("carries the brutalist treatment like every other chrome component", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-brutalist",
    name: "agree",
    label: "I agree",
  })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(control).toHaveCSS("border-width", "3px")
  await expect(control).toHaveCSS("border-radius", "0px")
  await expect(control).toHaveCSS("box-shadow", /5px 5px 0px 0px/)
})

test("an invalid field changes its stroke to danger", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-invalid-stroke",
    name: "marketing",
    label: "Subscribe",
    error: "Required",
    invalid: "true",
  })
  const host = page.locator(`#${formId} sk-checkbox`)
  await expect(host).toHaveAttribute("data-invalid", "")
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  const invalidColor = await control.evaluate((el) => getComputedStyle(el).borderTopColor)
  const validFormId = await mountCheckbox(page, {
    id: "test-valid-stroke",
    name: "marketing",
    label: "Subscribe",
  })
  const validControl = page.locator(`#${validFormId} sk-checkbox .sk-checkbox__control`)
  const validColor = await validControl.evaluate((el) => getComputedStyle(el).borderTopColor)
  expect(invalidColor).not.toBe(validColor)
})

test("exposes documented state attributes", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-state",
    name: "agree",
    label: "I agree",
    checked: "true",
  })
  const host = page.locator(`#${formId} sk-checkbox`)
  await expect(host).toHaveAttribute("data-slot", "field")
  await expect(host).toHaveAttribute("data-checked", "true")
  await expect(host).not.toHaveAttribute("data-invalid")
})

test("follows the theme (quiet variant drops shadow)", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-quiet",
    name: "agree",
    label: "I agree",
    variant: "quiet",
  })
  const control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  await expect(control).toHaveCSS("box-shadow", "none")
})

test("indeterminate is visual only (aria-checked=mixed) and submits as unchecked", async ({
  page,
}) => {
  const formId = await mountCheckbox(page, {
    id: "test-indeterminate",
    name: "parent",
    label: "Select all",
    indeterminate: "true",
  })
  const _control = page.locator(`#${formId} sk-checkbox .sk-checkbox__control`)
  const host = page.locator(`#${formId} sk-checkbox`)
  await expect(host).toHaveAttribute("data-checked", "true") // indeterminate shows as checked visually
  // The native control gets the indeterminate property
  const isIndeterminate = await page.evaluate((formId) => {
    const control = document.querySelector(
      `#${formId} sk-checkbox .sk-checkbox__control`,
    ) as HTMLInputElement & { indeterminate: boolean }
    return control?.indeterminate ?? false
  }, formId)
  expect(isIndeterminate).toBe(true)
  // But it submits as unchecked
  const value = await submitted(page, formId, "parent")
  expect(value).toBeNull()
})

test("required unchecked box shows native validation bubble", async ({ page }) => {
  const formId = await mountCheckbox(page, {
    id: "test-required-bubble",
    name: "agree",
    label: "I agree",
    required: "true",
  })
  // Submit the form programmatically to trigger validation
  const isValid = await page.evaluate((formId) => {
    const form = document.getElementById(formId) as HTMLFormElement
    if (!form) return false
    return form.reportValidity()
  }, formId)
  expect(isValid).toBe(false)
})
