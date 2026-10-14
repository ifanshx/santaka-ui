import { expect, test, type Page } from "@playwright/test"

/**
 * Switch browser tests.
 *
 * Covers the Checkbox contract under `role="switch"`: FACE with all three
 * callbacks, native constraint validation through `required`,
 * label/description/error wiring, `sk-value-change` only for user-initiated
 * changes, and the on/off state attribute.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Append a form containing one `sk-switch`, and wait for the element to upgrade.
 * Returns the form id so the test can submit it later.
 */
let probeCount = 0

async function mountSwitch(page: Page, attrs: Record<string, string>) {
  const formId = `probe-form-${probeCount++}`
  const tagAttrs = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`)
    .join(" ")
  await page.evaluate(
    ({ formId, tagAttrs }) => {
      const form = document.createElement("form")
      form.id = formId
      form.innerHTML = `<sk-switch ${tagAttrs}></sk-switch>`
      document.body.appendChild(form)
    },
    { formId, tagAttrs },
  )
  await page.waitForSelector(`#${formId} sk-switch .sk-switch__control`)
  return formId
}

/** What a submission of the mounted switch carries, read via `FormData`. */
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

/** Mark the element when a change event arrives, on the element itself. */
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

test("renders a real native checkbox input carrying role=switch", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-native", name: "dark", label: "Dark mode" })
  const control = page.locator(`#${formId} sk-switch .sk-switch__control`)
  await expect(control).toHaveAttribute("type", "checkbox")
  await expect(control).toHaveAttribute("role", "switch")
  // It is a real input, not a div with a role: the platform owns FACE.
  await expect(control).toHaveCount(1)
})

test("submits its value through a plain form when on", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-submit",
    name: "dark",
    label: "Dark mode",
    checked: "true",
  })
  const value = await submitted(page, formId, "dark")
  expect(value).toBe("on")
})

test("submits nothing when off (withholds the entry entirely)", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-off", name: "dark", label: "Dark mode" })
  const value = await submitted(page, formId, "dark")
  expect(value).toBeNull()
})

test("toggles the submitted value on user click", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-toggle", name: "dark", label: "Dark mode" })
  const host = page.locator(`#${formId} sk-switch`)
  await expect(host).toHaveAttribute("data-state", "unchecked")
  await page.locator(`#${formId} sk-switch .sk-switch__label`).click()
  await expect(host).toHaveAttribute("data-state", "checked")
  const value = await submitted(page, formId, "dark")
  expect(value).toBe("on")
})

test("a disabled switch is excluded from the submission", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-disabled",
    name: "dark",
    label: "Dark mode",
    checked: "true",
    disabled: "true",
  })
  const value = await submitted(page, formId, "dark")
  expect(value).toBeNull()
})

test("a form reset returns the switch to its initial state", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-reset",
    name: "dark",
    label: "Dark mode",
    checked: "true",
  })
  const host = page.locator(`#${formId} sk-switch`)
  await expect(host).toHaveAttribute("data-state", "checked")
  await page.evaluate((formId) => {
    ;(document.getElementById(formId) as HTMLFormElement).reset()
  }, formId)
  await expect(host).toHaveAttribute("data-state", "unchecked")
})

test("required is enforced natively rather than by this component", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-required",
    name: "ack",
    label: "I acknowledge",
    required: "true",
  })
  const control = page.locator(`#${formId} sk-switch .sk-switch__control`)
  await expect(control).toHaveAttribute("required", "")
  // The native validity object reports the violation; the component does not
  // reimplement the message.
  const invalid = await control.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)
  expect(invalid).toBe(true)
})

test("an error sets aria-invalid and is described by the error element", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-error",
    name: "ack",
    label: "I acknowledge",
    error: "Required before continuing.",
    invalid: "true",
  })
  const control = page.locator(`#${formId} sk-switch .sk-switch__control`)
  await expect(control).toHaveAttribute("aria-invalid", "true")
  const errorEl = page.locator(`#${formId} sk-switch .sk-switch__error`)
  const errorId = await errorEl.getAttribute("id")
  await expect(control).toHaveAttribute("aria-describedby", errorId!)
})

test("an error is never conveyed by color alone (WCAG 1.4.1)", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-error-icon",
    name: "ack",
    label: "I acknowledge",
    error: "Required before continuing.",
    invalid: "true",
  })
  const errorText = page.locator(`#${formId} sk-switch .sk-switch__error span`)
  await expect(errorText).toContainText("Required before continuing.")
  // The error carries an icon element beside its text.
  await expect(page.locator(`#${formId} sk-switch .sk-switch__error-icon`)).toHaveCount(1)
})

test("description is wired through aria-describedby, and yields to an error", async ({ page }) => {
  let formId = await mountSwitch(page, {
    id: "test-desc",
    name: "dark",
    label: "Dark mode",
    description: "Applies immediately.",
  })
  let control = page.locator(`#${formId} sk-switch .sk-switch__control`)
  const descEl = page.locator(`#${formId} sk-switch .sk-switch__description`)
  const descId = await descEl.getAttribute("id")
  expect(descId).toBeTruthy()
  await expect(control).toHaveAttribute("aria-describedby", descId!)

  // Error overrides description
  formId = await mountSwitch(page, {
    id: "test-desc-error",
    name: "dark",
    label: "Dark mode",
    description: "Applies immediately.",
    error: "Required.",
    invalid: "true",
  })
  control = page.locator(`#${formId} sk-switch .sk-switch__control`)
  const errorEl = page.locator(`#${formId} sk-switch .sk-switch__error`)
  const errorId = await errorEl.getAttribute("id")
  await expect(control).toHaveAttribute("aria-describedby", errorId!)
})

test("label wraps the input, making the whole row the activation target", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-label", name: "dark", label: "Dark mode" })
  const host = page.locator(`#${formId} sk-switch`)
  // Clicking the label text (not the track) toggles: the label wraps the input.
  await page.locator(`#${formId} sk-switch .sk-switch__text`).click()
  await expect(host).toHaveAttribute("data-state", "checked")
})

test("emits sk-value-change for user click", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-change-event", name: "dark", label: "Dark" })
  await watchChanges(page, "test-change-event")
  await page.locator(`#${formId} sk-switch .sk-switch__label`).click()
  const changes = await recordedChanges(page, "test-change-event")
  expect(changes).toEqual([{ checked: true }])
})

test("a programmatic checked assignment does not fire a change event", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-programmatic", name: "dark", label: "Dark" })
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
  const formId = await mountSwitch(page, { id: "test-keyboard", name: "dark", label: "Dark" })
  const control = page.locator(`#${formId} sk-switch .sk-switch__control`)
  await control.focus()
  await expect(control).toBeFocused()
  // Space toggles it: the platform's keyboard behavior, not reimplemented.
  await page.keyboard.press("Space")
  const host = page.locator(`#${formId} sk-switch`)
  await expect(host).toHaveAttribute("data-state", "checked")
  // The row is the activation target: the whole label row is at least 44px.
  const rowHeight = await page
    .locator(`#${formId} sk-switch .sk-switch__label`)
    .evaluate((el) => el.getBoundingClientRect().height)
  expect(rowHeight).toBeGreaterThanOrEqual(44)
})

test("carries the brutalist treatment like every other chrome component", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-brutalist", name: "dark", label: "Dark" })
  const track = page.locator(`#${formId} sk-switch .sk-switch__track`)
  await expect(track).toHaveCSS("border-width", "3px")
  await expect(track).toHaveCSS("border-radius", "0px")
  const shadow = await track.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(shadow).toMatch(/5px 5px 0px 0px/)
})

test("exposes documented state attributes", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-attrs",
    name: "dark",
    label: "Dark",
    checked: "true",
  })
  const host = page.locator(`#${formId} sk-switch`)
  await expect(host).toHaveAttribute("data-slot", "field")
  await expect(host).toHaveAttribute("data-state", "checked")
  await expect(host).not.toHaveAttribute("data-invalid")
})

test("follows the theme (quiet variant drops shadow)", async ({ page }) => {
  const formId = await mountSwitch(page, {
    id: "test-quiet",
    name: "dark",
    label: "Dark",
    variant: "quiet",
  })
  const track = page.locator(`#${formId} sk-switch .sk-switch__track`)
  await expect(track).toHaveCSS("box-shadow", "none")
})

test("the thumb moves when toggled", async ({ page }) => {
  const formId = await mountSwitch(page, { id: "test-thumb", name: "dark", label: "Dark" })
  const thumb = page.locator(`#${formId} sk-switch .sk-switch__thumb`)
  const rest = await thumb.evaluate((el) => getComputedStyle(el).transform)
  await page.locator(`#${formId} sk-switch .sk-switch__label`).click()
  await expect
    .poll(async () => thumb.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(rest)
})
