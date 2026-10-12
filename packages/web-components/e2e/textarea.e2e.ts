import { expect, test, type Page } from "@playwright/test"

/**
 * Textarea browser tests.
 *
 * Most of this is the same contract `sk-input` proves, which is the point: both
 * components are backed by one shared form-control base, so a regression in the
 * shared behavior has to be caught here too rather than assumed covered by the
 * input suite. The tests that are genuinely textarea-specific are the ones
 * about `rows`, about taking its initial value as children rather than an
 * attribute, and about having no `pattern`.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Append a form containing one `sk-textarea` and wait for it to upgrade.
 *
 * The markup is assigned through `innerHTML` rather than created with
 * `document.createElement("sk-textarea")`, because a created custom element only
 * upgrades if its definition has already run, which inside one `page.evaluate` it
 * has not.
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
      wrapper.innerHTML = `<form id="${formId}"><sk-textarea ${encoded}></sk-textarea></form>`
      document.body.appendChild(wrapper.firstElementChild as HTMLFormElement)
    },
    { formId: id, a: attrs },
  )

  const form = page.locator(`#${id}`)
  const control = form.locator("textarea[data-slot='control']")
  await expect(control).toHaveCount(1)
  return { id, field: form.locator("sk-textarea"), control, form }
}

async function submitted(page: Page, formId: string, name: string) {
  return page.evaluate(
    ({ selector, fieldName }) => {
      const data = new FormData(document.querySelector(selector) as HTMLFormElement)
      return { has: data.has(fieldName), value: String(data.get(fieldName) ?? "") }
    },
    { selector: `#${formId}`, fieldName: name },
  )
}

test("renders a real native textarea", async ({ page }) => {
  const field = page.locator("sk-textarea#example-bio")
  await expect(field).toBeVisible()

  const control = field.locator("textarea[data-slot='control']")
  expect(await control.evaluate((el) => el.tagName)).toBe("TEXTAREA")
  expect(await control.evaluate((el) => el.getAttribute("role"))).toBeNull()
})

test("submits its value through a plain form", async ({ page }) => {
  const { id, control } = await mountField(page, { name: "notes" })
  await control.fill("first line\nsecond line")
  const result = await submitted(page, id, "notes")
  expect(result.has).toBe(true)
  expect(result.value).toBe("first line\nsecond line")
})

test("sizes itself from rows, the way the browser renders it", async ({ page }) => {
  const { control } = await mountField(page, { name: "notes", rows: "8" })
  expect(await control.getAttribute("rows")).toBe("8")

  // More rows must render taller than fewer rows, or the prop is decorative.
  const tall = await control.evaluate((el) => el.getBoundingClientRect().height)
  const { control: short } = await mountField(page, { name: "other", rows: "2" })
  const small = await short.evaluate((el) => el.getBoundingClientRect().height)
  expect(tall).toBeGreaterThan(small)
})

test("takes its initial value from children, the way a textarea does", async ({ page }) => {
  // A <textarea> reads its content as children, not from a `value` attribute, so
  // a component that only read the attribute would render an empty field. The
  // element must be given a chance to upgrade before the form is read, or this
  // measures the gap between parsing and definition rather than the behavior.
  const value = await page.evaluate(async () => {
    const form = document.createElement("form")
    form.innerHTML = "<sk-textarea name='bio'>initial from children</sk-textarea>"
    document.body.appendChild(form)
    await customElements.whenDefined("sk-textarea")
    await new Promise((resolve) => setTimeout(resolve, 200))
    return new FormData(form).get("bio")
  })
  expect(value).toBe("initial from children")
})

test("a disabled field is excluded from the submission", async ({ page }) => {
  const { id } = await mountField(page, { name: "notes", value: "hidden", disabled: "" })
  expect((await submitted(page, id, "notes")).has).toBe(false)
})

test("a form reset returns the field to its initial value", async ({ page }) => {
  const { control, form } = await mountField(page, { name: "notes", value: "initial" })
  expect(await control.inputValue()).toBe("initial")

  await control.fill("typed over")
  await form.evaluate((el: HTMLFormElement) => el.reset())

  expect(await control.inputValue()).toBe("initial")
})

test("a read-only field is still submitted, unlike a disabled one", async ({ page }) => {
  const { id, control } = await mountField(page, {
    name: "notes",
    value: "locked",
    readonly: "",
  })
  expect((await submitted(page, id, "notes")).value).toBe("locked")
  expect(await control.evaluate((el) => (el as HTMLTextAreaElement).readOnly)).toBe(true)
  expect(
    await control.evaluate((el) => (el as HTMLTextAreaElement).tabIndex),
  ).toBeGreaterThanOrEqual(0)
})

test("required is enforced natively", async ({ page }) => {
  const { control } = await mountField(page, { name: "summary", required: "" })
  const state = await control.evaluate((el) => {
    const field = el as HTMLTextAreaElement
    return {
      required: field.required,
      missing: field.validity.valueMissing,
      valid: field.validity.valid,
    }
  })
  expect(state.required).toBe(true)
  expect(state.missing).toBe(true)
  expect(state.valid).toBe(false)
})

test("maxlength and minlength reach the rendered control", async ({ page }) => {
  const { control } = await mountField(page, { name: "notes", minlength: "5", maxlength: "10" })

  // The browser enforces maxlength itself: typing past it is refused, so
  // `validity.tooLong` can never become true by typing, and asserting it would be
  // asserting something unreachable. What is observable is that the bounds
  // arrived at all, and that the upper one actually restricts input.
  await control.fill("this is definitely longer than ten characters")
  expect((await control.inputValue()).length).toBeLessThanOrEqual(10)

  const bounds = await control.evaluate((el) => {
    const field = el as HTMLTextAreaElement
    return { min: field.minLength, max: field.maxLength }
  })
  expect(bounds.max).toBe(10)
  expect(bounds.min).toBe(5)

  // The lower bound is reported, not enforced: too-short is a validity state
  // the consumer acts on, not a restriction on typing.
  await control.fill("ab")
  expect(await control.evaluate((el) => (el as HTMLTextAreaElement).validity.tooShort)).toBe(true)
})

test("has no pattern, because long-form text has no single-line grammar", async ({ page }) => {
  const { control } = await mountField(page, { name: "notes", value: "anything at all" })
  const pattern = await control.getAttribute("pattern")
  // Accepted and silently ignored would be worse than absent: the consumer would
  // believe a constraint was enforced.
  expect(pattern).toBeNull()
})

test("an error sets aria-invalid and is described by the error element", async ({ page }) => {
  const field = page.locator("sk-textarea#example-notes-error")
  const control = field.locator("textarea[data-slot='control']")

  await expect(control).toHaveAttribute("aria-invalid", "true")
  await expect(field).toHaveAttribute("data-invalid", "")

  const describedBy = await control.getAttribute("aria-describedby")
  const errorId = await field.locator('[data-slot="error"]').getAttribute("id")
  expect(describedBy).toContain(errorId ?? "")
})

test("an error is never conveyed by color alone (WCAG 1.4.1)", async ({ page }) => {
  const error = page.locator('sk-textarea#example-notes-error [data-slot="error"]')
  await expect(error.locator('[data-slot="error-icon"]')).toHaveCount(1)
  await expect(error).toContainText("required before publishing")
})

test("description is wired through aria-describedby and yields to an error", async ({ page }) => {
  const withDescription = page.locator("sk-textarea#example-bio")
  const control = withDescription.locator("textarea[data-slot='control']")
  const descriptionId = await withDescription
    .locator('[data-slot="description"]')
    .getAttribute("id")
  expect(await control.getAttribute("aria-describedby")).toContain(descriptionId ?? "")

  const withError = page.locator("sk-textarea#example-notes-error")
  await expect(withError.locator('[data-slot="description"]')).toHaveCount(0)
  await expect(withError.locator('[data-slot="error"]')).toHaveCount(1)
})

test("the label is associated with the control and clicking it focuses", async ({ page }) => {
  const field = page.locator("sk-textarea#example-bio")
  const labelFor = await field.locator('[data-slot="label"]').getAttribute("for")
  const controlId = await field.locator("textarea[data-slot='control']").getAttribute("id")
  expect(labelFor).toBeTruthy()
  expect(labelFor).toBe(controlId)

  await field.locator('[data-slot="label"]').click()
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("TEXTAREA")
})

test("emits sk-value-change for user input", async ({ page }) => {
  const { id, control } = await mountField(page, { name: "notes" })
  await page.evaluate((formId) => {
    const field = document.querySelector(`#${formId} sk-textarea`)
    field?.addEventListener("sk-value-change", () => field.setAttribute("data-change-count", "1"))
  }, id)

  await control.fill("typed")
  await control.dispatchEvent("change")
  await expect(page.locator(`#${id} sk-textarea`)).toHaveAttribute("data-change-count", "1")
})

test("a programmatic value assignment does not fire a change event", async ({ page }) => {
  const { id, control } = await mountField(page, { name: "notes", value: "start" })
  await page.evaluate((formId) => {
    const field = document.querySelector(`#${formId} sk-textarea`)
    field?.addEventListener("sk-value-change", () => field.setAttribute("data-change-count", "1"))
  }, id)

  await page.evaluate((formId) => {
    const field = document.querySelector(`#${formId} sk-textarea`) as { value: string }
    field.value = "set programmatically"
  }, id)

  await expect(control).toHaveValue("set programmatically")
  await expect(page.locator(`#${id} sk-textarea`)).not.toHaveAttribute("data-change-count", "1")
  expect((await submitted(page, id, "notes")).value).toBe("set programmatically")
})

test("is keyboard focusable and meets the 44px target", async ({ page }) => {
  const { control } = await mountField(page, { name: "notes" })
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
  const { control } = await mountField(page, { name: "notes" })
  const style = await control.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      borderWidth: cs.borderTopWidth,
      radius: cs.borderTopLeftRadius,
      boxShadow: cs.boxShadow,
    }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.radius).toBe("0px")
  expect(style.boxShadow).not.toBe("none")
  expect(style.boxShadow).toMatch(/px 0px/)
})

test("resizes vertically by default, because long-form text is edited", async ({ page }) => {
  const { control } = await mountField(page, { name: "notes" })
  expect(await control.evaluate((el) => getComputedStyle(el).resize)).toBe("vertical")
})

test("exposes documented state attributes", async ({ page }) => {
  for (const id of ["example-bio", "example-notes-readonly", "example-notes-error"]) {
    await expect(page.locator(`sk-textarea#${id}`)).toHaveAttribute("data-slot", "field")
  }
  await expect(page.locator("sk-textarea#example-notes-error")).toHaveAttribute("data-invalid", "")
})

test("follows the theme", async ({ page }) => {
  const read = () =>
    page
      .locator('sk-textarea#example-bio textarea[data-slot="control"]')
      .evaluate((el) => getComputedStyle(el).borderTopColor)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()
  expect(dark).not.toBe(light)
})
