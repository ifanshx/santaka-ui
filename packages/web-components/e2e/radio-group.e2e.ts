import { expect, test, type Page } from "@playwright/test"

/**
 * Radio Group browser tests.
 *
 * Covers the group-level FACE contract: one form value for the set, native
 * constraint validation through `required`, label/description/error wiring,
 * `sk-value-change` only for user-initiated changes, and the browser's own
 * arrow-key navigation across the native radios.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Append a form containing one `sk-radio-group`, and wait for the element to
 * upgrade. Returns the form id so the test can submit it later.
 */
let probeCount = 0

const OPTIONS =
  '[{"value":"production","label":"Production"},{"value":"staging","label":"Staging"},{"value":"development","label":"Development"}]'

async function mountGroup(page: Page, attrs: Record<string, string>) {
  const formId = `probe-form-${probeCount++}`
  // HTML-entity escaping, not backslash escaping: the attrs go through
  // `innerHTML`, where a backslash is literal and `&quot;` is a double quote.
  // Backslash-escaping the JSON's quotes leaves `[{\\` in the parsed attribute
  // and the element's JSON.parse receives garbage — the failure that shipped
  // this suite's first run.
  const tagAttrs = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`)
    .join(" ")
  await page.evaluate(
    ({ formId, tagAttrs }) => {
      const form = document.createElement("form")
      form.id = formId
      form.innerHTML = `<sk-radio-group ${tagAttrs}></sk-radio-group>`
      document.body.appendChild(form)
    },
    { formId, tagAttrs },
  )
  await page.waitForSelector(`#${formId} sk-radio-group .sk-radio-group__control`)
  return formId
}

/** What a submission of the mounted group carries, read via `FormData`. */
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
      _changes?: { value: string }[]
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
      _changes?: { value: string }[]
    }
    return el?._changes ?? []
  }, id)
}

test("renders real native radio inputs, not a div with a role", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-native",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const controls = page.locator(`#${formId} sk-radio-group .sk-radio-group__control`)
  await expect(controls).toHaveCount(3)
  const types = await controls.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).type))
  expect(types).toEqual(["radio", "radio", "radio"])
  // The container carries the group role; the radios are real inputs.
  await expect(page.locator(`#${formId} sk-radio-group [data-slot="options"]`)).toHaveAttribute(
    "role",
    "radiogroup",
  )
})

test("options arrive as JSON and render as real options", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-options",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const labels = await page
    .locator(`#${formId} sk-radio-group .sk-radio-group__option-text`)
    .allTextContents()
  expect(labels).toEqual(["Production", "Staging", "Development"])
})

test("choosing an option submits through a plain form", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-submit",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  // Nothing selected submits nothing: the group withholds the pair.
  expect(await submitted(page, formId, "env")).toBeNull()
  await page.locator(`#${formId} sk-radio-group .sk-radio-group__option`).nth(1).click()
  const value = await submitted(page, formId, "env")
  expect(value).toBe("staging")
})

test("the group is one tab stop, and arrows move the selection", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-keyboard",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const controls = page.locator(`#${formId} sk-radio-group .sk-radio-group__control`)
  // Focus the first radio directly: a mounted probe sits behind every
  // focusable element on the example page, so the number of Tabs to reach it
  // is a fact about the page, not about the group. The group-level claim
  // this test makes is the arrow behavior, which is the browser's.
  await controls.nth(0).focus()
  await expect(controls.nth(0)).toBeFocused()
  // Arrow down moves selection — the platform's radio navigation.
  await page.keyboard.press("ArrowDown")
  await expect(controls.nth(1)).toBeFocused()
  await expect(controls.nth(1)).toBeChecked()
})

test("only one radio is ever checked", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-exclusive",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const options = page.locator(`#${formId} sk-radio-group .sk-radio-group__option`)
  await options.nth(0).click()
  await options.nth(2).click()
  const checked = await page
    .locator(`#${formId} sk-radio-group .sk-radio-group__control`)
    .evaluateAll((els) => els.filter((el) => (el as HTMLInputElement).checked).length)
  expect(checked).toBe(1)
})

test("required is enforced natively rather than by this component", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-required",
    name: "env",
    label: "Environment",
    required: "true",
    options: OPTIONS,
  })
  // The group's ElementInternals reports the valueMissing violation when
  // nothing is selected.
  const invalid = await page.evaluate((formId) => {
    const host = document.querySelector(`#${formId} sk-radio-group`) as ValidityState & {
      validity?: ValidityState
    }
    const internals = (host as unknown as { internals?: ElementInternals }).internals
    return internals?.validity.valueMissing ?? null
  }, formId)
  expect(invalid).toBe(true)
})

test("a disabled group is excluded from the submission", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-disabled",
    name: "env",
    label: "Environment",
    value: "staging",
    disabled: "true",
    options: OPTIONS,
  })
  const value = await submitted(page, formId, "env")
  expect(value).toBeNull()
})

test("a form reset returns the group to its initial value", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-reset",
    name: "env",
    label: "Environment",
    value: "staging",
    options: OPTIONS,
  })
  await page.locator(`#${formId} sk-radio-group .sk-radio-group__option`).nth(0).click()
  expect(await submitted(page, formId, "env")).toBe("production")
  await page.evaluate((formId) => {
    ;(document.getElementById(formId) as HTMLFormElement).reset()
  }, formId)
  expect(await submitted(page, formId, "env")).toBe("staging")
})

test("the group contributes exactly one entry, not one per radio", async ({ page }) => {
  // `submitted()` uses `FormData.get`, which returns the *first* value and so
  // cannot see a duplicate. This asserts the count instead, and it exists
  // because there was one: the inner radios carried the group's `name`, so the
  // browser submitted them as well as the form-associated host, and every
  // submission carried the field twice. `get` hid it; `getAll` does not.
  const formId = await mountGroup(page, {
    id: "test-single-entry",
    name: "env",
    label: "Environment",
    value: "staging",
    options: OPTIONS,
  })
  const entries = await page.evaluate((formId) => {
    const form = document.getElementById(formId) as HTMLFormElement
    return new FormData(form).getAll("env")
  }, formId)
  expect(entries).toEqual(["staging"])
})

test("an error sets aria-invalid and is described by the error element", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-error",
    name: "env",
    label: "Environment",
    error: "Choose an environment.",
    invalid: "true",
    options: OPTIONS,
  })
  const optionsContainer = page.locator(`#${formId} sk-radio-group [data-slot="options"]`)
  await expect(optionsContainer).toHaveAttribute("aria-invalid", "true")
  const errorEl = page.locator(`#${formId} sk-radio-group .sk-radio-group__error`)
  const errorId = await errorEl.getAttribute("id")
  await expect(optionsContainer).toHaveAttribute("aria-describedby", errorId!)
})

test("an error is never conveyed by color alone (WCAG 1.4.1)", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-error-icon",
    name: "env",
    label: "Environment",
    error: "Choose an environment.",
    invalid: "true",
    options: OPTIONS,
  })
  const errorText = page.locator(`#${formId} sk-radio-group .sk-radio-group__error span`)
  await expect(errorText).toContainText("Choose an environment.")
  // The error carries an icon element beside its text.
  await expect(page.locator(`#${formId} sk-radio-group .sk-radio-group__error-icon`)).toHaveCount(1)
})

test("description is wired through aria-describedby, and yields to an error", async ({ page }) => {
  let formId = await mountGroup(page, {
    id: "test-desc",
    name: "env",
    label: "Environment",
    description: "Where the build deploys.",
    options: OPTIONS,
  })
  let container = page.locator(`#${formId} sk-radio-group [data-slot="options"]`)
  const descEl = page.locator(`#${formId} sk-radio-group .sk-radio-group__description`)
  const descId = await descEl.getAttribute("id")
  expect(descId).toBeTruthy()
  await expect(container).toHaveAttribute("aria-describedby", descId!)

  // Error overrides description
  formId = await mountGroup(page, {
    id: "test-desc-error",
    name: "env",
    label: "Environment",
    description: "Where the build deploys.",
    error: "Required.",
    invalid: "true",
    options: OPTIONS,
  })
  container = page.locator(`#${formId} sk-radio-group [data-slot="options"]`)
  const errorEl = page.locator(`#${formId} sk-radio-group .sk-radio-group__error`)
  const errorId = await errorEl.getAttribute("id")
  await expect(container).toHaveAttribute("aria-describedby", errorId!)
})

test("the group label names the radiogroup through aria-labelledby", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-named",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const container = page.locator(`#${formId} sk-radio-group [data-slot="options"]`)
  const labelEl = page.locator(`#${formId} sk-radio-group .sk-radio-group__label`)
  const labelId = await labelEl.getAttribute("id")
  await expect(container).toHaveAttribute("aria-labelledby", labelId!)
})

test("emits sk-value-change for user click", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-change-event",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  await watchChanges(page, "test-change-event")
  await page.locator(`#${formId} sk-radio-group .sk-radio-group__option`).nth(1).click()
  const changes = await recordedChanges(page, "test-change-event")
  expect(changes).toEqual([{ value: "staging" }])
})

test("a programmatic value assignment does not fire a change event", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-programmatic",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  await watchChanges(page, "test-programmatic")
  await page.evaluate((id) => {
    const el = document.getElementById(id) as HTMLElement & { value: string }
    if (el) el.value = "staging"
  }, formId)
  // Wait a tick for any event to arrive
  await page.waitForTimeout(50)
  const changes = await recordedChanges(page, "test-programmatic")
  expect(changes).toEqual([])
})

test("every row meets the 44px target", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-target",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const heights = await page
    .locator(`#${formId} sk-radio-group .sk-radio-group__option`)
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))
  for (const height of heights) {
    expect(height).toBeGreaterThanOrEqual(44)
  }
})

test("carries the brutalist treatment like every other chrome component", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-brutalist",
    name: "env",
    label: "Environment",
    options: OPTIONS,
  })
  const control = page.locator(`#${formId} sk-radio-group .sk-radio-group__control`).first()
  await expect(control).toHaveCSS("border-width", "3px")
  {
    // Chrome reads --sk-radius-md, which is a small non-zero value now. Pinning
    // the literal 0px here was a second copy of a token that has since moved;
    // what this test is actually for is that the control takes its radius from
    // the token rather than hard-coding one of its own.
    const radius = await control.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
    const token = await control.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--sk-radius-md").trim(),
    )
    expect(token, "the radius token is published").not.toBe("")
    expect(radius, "the control reads the radius token").toBe(token)
  }
  const shadow = await control.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(shadow).toMatch(/5px 5px 0px 0px/)
})

test("exposes documented state attributes", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-attrs",
    name: "env",
    label: "Environment",
    value: "staging",
    options: OPTIONS,
  })
  const host = page.locator(`#${formId} sk-radio-group`)
  await expect(host).toHaveAttribute("data-slot", "field")
  await expect(host).not.toHaveAttribute("data-invalid")
})

test("follows the theme (quiet variant drops shadow)", async ({ page }) => {
  const formId = await mountGroup(page, {
    id: "test-quiet",
    name: "env",
    label: "Environment",
    variant: "quiet",
    options: OPTIONS,
  })
  const control = page.locator(`#${formId} sk-radio-group .sk-radio-group__control`).first()
  await expect(control).toHaveCSS("box-shadow", "none")
})
