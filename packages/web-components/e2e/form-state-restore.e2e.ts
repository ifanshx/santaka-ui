import { expect, test, type Page } from "@playwright/test"

/**
 * `formStateRestoreCallback` coverage for all six form-associated controls.
 *
 * This is the third FACE callback, and until now the only one with no test.
 * `formResetCallback` and `formDisabledCallback` are covered per component; the
 * restore path was implemented on all six and asserted nowhere.
 *
 * **Why a browser test cannot reach it through the real trigger.** The callback
 * fires when the browser restores a form's state — a session restore after a
 * process exit, or an autocomplete refill. Neither is drivable from a page test.
 * The obvious candidate, the back/forward cache, does not do it: measured in
 * Chromium, navigating away and calling `page.goBack()` restores the *DOM*
 * intact, so the value survives without the callback running once. A test built
 * on that navigation would pass with the callback deleted.
 *
 * So the seam is a direct invocation — `el.formStateRestoreCallback(state, "restore")`
 * — which is the exact call the platform makes, with the exact arguments. What
 * this suite does *not* prove is that the platform calls it; that is the
 * browser's contract, not this library's. What it proves is the part that is
 * this library's: that when the call arrives, the value lands in the prop, in
 * the rendered control, and in `FormData`, that it fires no `sk-value-change`
 * (a restore is not a user action), and that a mode other than `"restore"` is
 * ignored.
 *
 * One test per control rather than one shared loop, because the six disagree on
 * the state type — a string for the text controls, `"on"`/absent for the
 * booleans, a value for the group — and on what "the rendered control" is.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const OPTIONS =
  '[{"value":"production","label":"Production"},{"value":"staging","label":"Staging"}]'

/**
 * Mount a form containing one control, and wait for it to upgrade.
 *
 * The wait is on the element's own rendered control rather than on a timeout,
 * because that is the real signal that the custom element upgraded and its
 * internal listener/accessor wiring is in place.
 */
async function mount(
  page: Page,
  tag: string,
  attrs: Record<string, string>,
  readySelector: string,
): Promise<string> {
  const formId = `restore-form-${Math.random().toString(36).slice(2, 8)}`
  const tagAttrs = Object.entries(attrs)
    .map(([key, value]) => `${key}="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`)
    .join(" ")

  await page.evaluate(
    ({ formId, tag, tagAttrs }) => {
      const form = document.createElement("form")
      form.id = formId
      form.innerHTML = `<${tag} ${tagAttrs}></${tag}>`
      document.body.appendChild(form)
    },
    { formId, tag, tagAttrs },
  )

  await page.waitForSelector(`#${formId} ${readySelector}`)
  return formId
}

/** What a submission of the mounted form carries. */
async function submitted(page: Page, formId: string): Promise<Record<string, string>> {
  return page.evaluate((id) => {
    const form = document.getElementById(id)
    if (!(form instanceof HTMLFormElement)) throw new Error(`#${id} is not a form`)
    return Object.fromEntries(new FormData(form).entries()) as Record<string, string>
  }, formId)
}

/**
 * Call the callback the way the platform does, and report what changed.
 *
 * Returns the event count as well as the values, because "restore fires no
 * `sk-value-change`" is part of the contract (§4: the event is for
 * user-initiated changes) and is the assertion most likely to regress silently.
 */
async function restore(
  page: Page,
  formId: string,
  tag: string,
  state: string | null,
  mode = "restore",
): Promise<{ changeEvents: number }> {
  return page.evaluate(
    async ({ formId, tag, state, mode }) => {
      const form = document.getElementById(formId)
      if (!form) throw new Error(`no form #${formId}`)
      const element = form.querySelector(tag)
      if (!element) throw new Error(`no ${tag} in #${formId}`)

      let changeEvents = 0
      const count = () => changeEvents++
      form.addEventListener("sk-value-change", count)
      try {
        // The platform's call. `mode` is "restore" on a session restore.
        ;(
          element as HTMLElement & {
            formStateRestoreCallback: (state: string | null, mode: string) => void
          }
        ).formStateRestoreCallback(state, mode)
        // One turn for Stencil's async task queue to render.
        await new Promise((resolve) => setTimeout(resolve, 50))
      } finally {
        form.removeEventListener("sk-value-change", count)
      }
      return { changeEvents }
    },
    { formId, tag, state, mode },
  )
}

test.describe("formStateRestoreCallback", () => {
  test("input: the restored value reaches the prop, the control, and the form", async ({
    page,
  }) => {
    const formId = await mount(
      page,
      "sk-input",
      { name: "code", label: "Code" },
      "input[data-slot='control']",
    )
    const control = page.locator(`#${formId} input[data-slot='control']`)

    await control.fill("typed")
    const { changeEvents } = await restore(page, formId, "sk-input", "restored")

    expect(await page.locator(`#${formId} sk-input`).evaluate((el) => el.value)).toBe("restored")
    expect(await control.inputValue()).toBe("restored")
    expect(await submitted(page, formId)).toEqual({ code: "restored" })
    // A restore is not a user action, so it must not look like one.
    expect(changeEvents).toBe(0)
  })

  test("textarea: the same contract, over the multi-line control", async ({ page }) => {
    const formId = await mount(
      page,
      "sk-textarea",
      { name: "notes", label: "Notes" },
      "textarea[data-slot='control']",
    )
    const control = page.locator(`#${formId} textarea[data-slot='control']`)

    await control.fill("draft")
    const { changeEvents } = await restore(page, formId, "sk-textarea", "restored notes")

    expect(await control.inputValue()).toBe("restored notes")
    expect(await submitted(page, formId)).toEqual({ notes: "restored notes" })
    expect(changeEvents).toBe(0)
  })

  test("select: the restored value selects the matching option", async ({ page }) => {
    const formId = await mount(
      page,
      "sk-select",
      { name: "env", label: "Environment", options: OPTIONS },
      "select[data-slot='control']",
    )
    const control = page.locator(`#${formId} select[data-slot='control']`)

    await control.selectOption("staging")
    const { changeEvents } = await restore(page, formId, "sk-select", "production")

    expect(await control.inputValue()).toBe("production")
    expect(await submitted(page, formId)).toEqual({ env: "production" })
    expect(changeEvents).toBe(0)
  })

  test("checkbox: restored state is parsed as a boolean, and submits as 'on'", async ({ page }) => {
    const formId = await mount(
      page,
      "sk-checkbox",
      { name: "agree", label: "Agree" },
      ".sk-checkbox__control",
    )
    const control = page.locator(`#${formId} .sk-checkbox__control`)

    expect(await control.isChecked()).toBe(false)
    const { changeEvents } = await restore(page, formId, "sk-checkbox", "on")

    expect(await control.isChecked()).toBe(true)
    // The platform's own encoding for a checked checkbox, which is what makes
    // the restored value indistinguishable from a typed one.
    expect(await submitted(page, formId)).toEqual({ agree: "on" })
    expect(changeEvents).toBe(0)
  })

  test("checkbox: a null or empty state restores to unchecked", async ({ page }) => {
    const formId = await mount(
      page,
      "sk-checkbox",
      { name: "agree", label: "Agree", checked: "" },
      ".sk-checkbox__control",
    )
    const control = page.locator(`#${formId} .sk-checkbox__control`)
    expect(await control.isChecked()).toBe(true)

    // `null` is what the platform passes for "no saved state"; `""` is what a
    // string-typed caller produces. Both must mean unchecked, not "leave it".
    await restore(page, formId, "sk-checkbox", null)
    expect(await control.isChecked()).toBe(false)

    await restore(page, formId, "sk-checkbox", "on")
    expect(await control.isChecked()).toBe(true)

    await restore(page, formId, "sk-checkbox", "")
    expect(await control.isChecked()).toBe(false)
  })

  test("switch: restored state is parsed as a boolean", async ({ page }) => {
    const formId = await mount(
      page,
      "sk-switch",
      { name: "notify", label: "Notify" },
      ".sk-switch__control",
    )
    const control = page.locator(`#${formId} .sk-switch__control`)

    expect(await control.isChecked()).toBe(false)
    const { changeEvents } = await restore(page, formId, "sk-switch", "on")

    expect(await control.isChecked()).toBe(true)
    expect(await submitted(page, formId)).toEqual({ notify: "on" })
    expect(changeEvents).toBe(0)
  })

  test("radio group: the restored value checks the matching radio", async ({ page }) => {
    const formId = await mount(
      page,
      "sk-radio-group",
      { name: "env", label: "Environment", options: OPTIONS },
      ".sk-radio-group__control",
    )
    const controls = page.locator(`#${formId} .sk-radio-group__control`)

    await controls.nth(1).check()
    const { changeEvents } = await restore(page, formId, "sk-radio-group", "production")

    // Exactly one radio is checked, and it is the restored one.
    expect(await controls.nth(0).isChecked()).toBe(true)
    expect(await controls.nth(1).isChecked()).toBe(false)
    expect(await submitted(page, formId)).toEqual({ env: "production" })
    expect(changeEvents).toBe(0)
  })

  test("a mode other than 'restore' is ignored", async ({ page }) => {
    // The platform passes `"autocomplete"` when a browser autofills. The
    // components guard on `mode === "restore"`, so an autocomplete call must not
    // move the value — otherwise every autofill would overwrite the field with
    // whatever the browser last saved.
    const formId = await mount(
      page,
      "sk-input",
      { name: "code", label: "Code" },
      "input[data-slot='control']",
    )
    const control = page.locator(`#${formId} input[data-slot='control']`)
    await control.fill("typed")

    await restore(page, formId, "sk-input", "from-autocomplete", "autocomplete")

    expect(await control.inputValue()).toBe("typed")
    expect(await submitted(page, formId)).toEqual({ code: "typed" })
  })

  test("a restore fires no sk-value-change on any control", async ({ page }) => {
    // The cross-component half of the same rule, checked once over all six so a
    // seventh control cannot quietly opt out.
    const mounts = [
      ["sk-input", { name: "a", label: "A" }, "input[data-slot='control']", "restored"],
      ["sk-textarea", { name: "b", label: "B" }, "textarea[data-slot='control']", "restored"],
      [
        "sk-select",
        { name: "c", label: "C", options: OPTIONS },
        "select[data-slot='control']",
        "production",
      ],
      ["sk-checkbox", { name: "d", label: "D" }, ".sk-checkbox__control", "on"],
      ["sk-switch", { name: "e", label: "E" }, ".sk-switch__control", "on"],
      [
        "sk-radio-group",
        { name: "f", label: "F", options: OPTIONS },
        ".sk-radio-group__control",
        "staging",
      ],
    ] as const

    for (const [tag, attrs, ready, state] of mounts) {
      const formId = await mount(page, tag, attrs, ready)
      const { changeEvents } = await restore(page, formId, tag, state)
      expect(changeEvents, `${tag} fired sk-value-change on restore`).toBe(0)
    }
  })
})
