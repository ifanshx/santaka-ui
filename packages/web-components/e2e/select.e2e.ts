import { expect, test } from "@playwright/test"

/**
 * Select browser tests.
 *
 * Select is the contract-heaviest control: FACE with all three callbacks,
 * native constraint validation, label wiring, and the change-event rule. The
 * architecture claim — a real native <select>, visibly — is what makes every
 * one of these tests pass without the component reimplementing a listbox.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const FIELD = 'sk-select[name="environment"]'
const CONTROL = `${FIELD} select[data-slot='control']`

test("it renders a real native select", async ({ page }) => {
  const tag = await page.locator(CONTROL).evaluate((el) => el.tagName)
  expect(tag).toBe("SELECT")
  // And it is visible, not a hidden filing cabinet behind a custom listbox.
  await expect(page.locator(CONTROL)).toBeVisible()
})

test("options arrive as JSON and render as real options", async ({ page }) => {
  const options = await page.locator(`${CONTROL} option`).allTextContents()
  expect(options).toContain("Production")
  expect(options).toContain("Staging")
  expect(options).toContain("Development")
})

test("the placeholder is a real empty option", async ({ page }) => {
  const placeholder = page.locator(`${CONTROL} option[value='']`)
  await expect(placeholder).toHaveText("Choose an environment")
  // A required select's placeholder must not be selectable as a value. The
  // attribute is present but empty, so the assertion is on presence.
  expect(await placeholder.getAttribute("disabled")).toBe("")
})

test("the label is associated and clicking focuses the control", async ({ page }) => {
  const label = page.locator(`${FIELD} [data-slot='label']`)
  const controlId = await label.getAttribute("for")
  expect(controlId).toBeTruthy()

  await label.click()
  await expect(page.locator(CONTROL)).toBeFocused()
})

test("choosing an option submits through a plain form", async ({ page }) => {
  // The whole point of FACE: no component state reading, just FormData. The
  // mount builds the element from attributes, not from an upgraded element's
  // outerHTML — the serialized DOM already contains a rendered <select>, and
  // re-upgrading renders a second one. Waiting for the inner select is the
  // real signal that the element upgraded.
  const formId = "select-submit-probe"
  await page.evaluate(() => {
    const wrapper = document.createElement("div")
    wrapper.innerHTML =
      '<form id="select-submit-probe">' +
      '<sk-select name="environment" required placeholder="Choose an environment"' +
      ' options=\'[{"value":"production","label":"Production"},{"value":"staging","label":"Staging"}]\'>' +
      "</sk-select></form>"
    document.body.appendChild(wrapper.firstElementChild as HTMLFormElement)
  })
  const control = page.locator(`#${formId} select[data-slot='control']`)
  await expect(control).toHaveCount(1)

  await control.selectOption("staging")
  const result = await page.evaluate((selector) => {
    const data = new FormData(document.querySelector(selector) as HTMLFormElement)
    return { has: data.has("environment"), value: String(data.get("environment") ?? "") }
  }, `#${formId}`)
  expect(result.has).toBe(true)
  expect(result.value).toBe("staging")
})

test("required is enforced natively", async ({ page }) => {
  const control = page.locator(CONTROL)
  // The placeholder is selected and the field is required: the browser says no.
  const valid = await control.evaluate((el) => (el as HTMLSelectElement).validity.valid)
  expect(valid).toBe(false)
  const valueMissing = await control.evaluate(
    (el) => (el as HTMLSelectElement).validity.valueMissing,
  )
  expect(valueMissing).toBe(true)
})

test("sk-value-change fires only for user-initiated changes", async ({ page }) => {
  // Mounted and waited-for, so the change listeners exist before anything
  // dispatches. Section 4: a change event fires only for user-initiated
  // changes, which is what keeps a controlled component from looping on its
  // own update. The page records the events; the test reads the record.
  const formId = "select-change-probe"
  await page.evaluate(() => {
    const wrapper = document.createElement("div")
    wrapper.innerHTML =
      '<form id="select-change-probe">' +
      '<sk-select name="environment"' +
      ' options=\'[{"value":"staging","label":"Staging"},{"value":"development","label":"Development"}]\'>' +
      "</sk-select></form>"
    document.body.appendChild(wrapper.firstElementChild as HTMLFormElement)
    const host = document.querySelector("#select-change-probe sk-select") as HTMLElement & {
      __log?: string[]
    }
    const log: string[] = []
    host.addEventListener("sk-value-change", () => log.push("event"))
    host.__log = log
  })
  const control = page.locator(`#${formId} select[data-slot='control']`)
  await expect(control).toHaveCount(1)

  // User path: selectOption produces a real change event.
  await control.selectOption("staging")
  // Programmatic path: assigning the prop must not fire the event.
  await page.locator(`#${formId} sk-select`).evaluate((el) => {
    ;(el as HTMLElement & { value: string }).value = "development"
  })

  const log = await page.evaluate(
    (id) =>
      (document.querySelector(`#${id} sk-select`) as HTMLElement & { __log?: string[] })?.__log ??
      [],
    formId,
  )
  expect(log).toEqual(["event"])
})

test("form reset returns to the initial value", async ({ page }) => {
  const result = await page.evaluate(() => {
    const source = document.querySelector('sk-select[name="runner"]')! as HTMLElement
    const form = document.createElement("form")
    const select = source.cloneNode(true) as HTMLElement
    form.appendChild(select)
    document.body.appendChild(form)
    const control = select.querySelector("select") as HTMLSelectElement
    control.value = "windows"
    control.dispatchEvent(new Event("change", { bubbles: true }))
    form.reset()
    return control.value
  })
  // The runner select's initial value is "linux".
  expect(result).toBe("linux")
})

test("a disabled ancestor fieldset withholds the value", async ({ page }) => {
  const result = await page.evaluate(() => {
    const source = document.querySelector('sk-select[name="environment"]')! as HTMLElement
    const form = document.createElement("form")
    const fieldset = document.createElement("fieldset")
    fieldset.disabled = true
    const select = source.cloneNode(true) as HTMLElement
    fieldset.appendChild(select)
    form.appendChild(fieldset)
    document.body.appendChild(form)
    const control = select.querySelector("select") as HTMLSelectElement
    control.value = "production"
    control.dispatchEvent(new Event("change", { bubbles: true }))
    const data = new FormData(form)
    return data.get("environment-control")
  })
  expect(result).toBeNull()
})

test("the label and supporting text share Input's record", async ({ page }) => {
  // A select beside an input must read identically. The classes are shared
  // with sk-input.css by design; this asserts the type step matches.
  const selectLabel = await page
    .locator(`${FIELD} [data-slot='label']`)
    .evaluate((el) => getComputedStyle(el).fontSize)
  // The sm step is 0.875rem = 14px at the default root size.
  expect(selectLabel).toBe("14px")
})

test("the quiet variant drops the shadow but keeps the stroke", async ({ page }) => {
  const style = await page
    .locator("sk-select[name='runner'] [data-slot='control']")
    .evaluate((el) => {
      const cs = getComputedStyle(el)
      return { shadow: cs.boxShadow, border: cs.borderTopWidth, radius: cs.borderTopLeftRadius }
    })
  expect(style.shadow).toBe("none")
  expect(style.border).toBe("3px")
  expect(style.radius).toBe("0px")
})
