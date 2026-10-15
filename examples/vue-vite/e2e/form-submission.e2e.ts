import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

/**
 * The Vue adapter submits through a plain `<form>`.
 *
 * This is the browser half of plan.md section 17's gate — "Every form control
 * submits through a plain `<form>` in React, Vue, and the universal package" —
 * and it mirrors `examples/react-vite/e2e/form-submission.e2e.ts`. The Vue
 * adapter's unit tests run under jsdom, which has no form submission and no
 * form-associated custom element implementation, so they could only ever assert
 * that `name` reached the element's attributes or property. Whether the browser
 * then *submits* the control is a different claim, and it needed a real browser.
 *
 * The Vue adapter carries a wrinkle the React adapter does not, and it is why
 * this file is not a copy of the React one: Vue chooses between a property and
 * an attribute with `key in element`. For `name`, that choice differs by
 * component — `Checkbox`, `Switch`, and `Select` write the attribute, while
 * `RadioGroup` writes the property — and both routes must end in a submitted
 * entry. The unit tests assert which route each component takes; this file
 * asserts that whichever route it takes, the browser receives the value.
 *
 * Every value below is read from the browser's own `FormData`, not from Vue
 * state and not from a hidden native input. That is what makes it evidence about
 * form participation rather than about the adapter's bookkeeping.
 */

/** The form as the browser submits it: entries in order, as string pairs. */
async function submitted(page: Page) {
  return page.evaluate(() => {
    const form = document.querySelector("form[data-testid='form']")
    if (form === null) return null
    return Array.from(new FormData(form as HTMLFormElement).entries()).map(
      ([name, value]) => [name, typeof value === "string" ? value : `<${value.name}>`] as const,
    )
  })
}

/** Wait for every custom element on the page to upgrade before asserting. */
async function waitForUpgrade(page: Page) {
  await page.waitForFunction(() => {
    const tags = [
      "sk-input",
      "sk-textarea",
      "sk-select",
      "sk-checkbox",
      "sk-switch",
      "sk-radio-group",
    ]
    return tags.every((tag) => customElements.get(tag) !== undefined)
  })
  // The upgrade defines the element; it does not guarantee the render that
  // exposes the inner control, so wait for one control of each kind.
  await page.waitForSelector("sk-input input[data-slot='control']")
  await page.waitForSelector("sk-checkbox .sk-checkbox__control")
  await page.waitForSelector("sk-switch .sk-switch__track")
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await waitForUpgrade(page)
})

test("renders every control as a custom element, not a native input", async ({ page }) => {
  // The Vue adapter must not substitute native elements: if it did, the FACE
  // behavior would be a re-implementation and the whole ownership rule would be
  // violated. A bare `<input>` outside a custom element would be that failure.
  const nativeOutsideElements = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll("input, select, textarea")).filter(
        (el) =>
          el.closest("sk-input, sk-select, sk-textarea, sk-checkbox, sk-switch, sk-radio-group") ===
          null,
      ).length,
  )
  expect(nativeOutsideElements).toBe(0)
})

test("submits every named control through the browser's own FormData", async ({ page }) => {
  await page.locator("sk-input[name='email'] input[data-slot='control']").fill("ada@example.com")
  await page.locator("sk-input[name='name'] input[data-slot='control']").fill("Ada Lovelace")
  await page.locator("sk-textarea[name='bio'] textarea[data-slot='control']").fill("Mathematician")
  await page.locator("sk-select[name='plan'] select[data-slot='control']").selectOption("pro")
  await page.locator("sk-checkbox[name='terms'] .sk-checkbox__control").click()
  await page.locator("sk-switch[name='updates'] .sk-switch__track").click()
  await page.locator("sk-radio-group[name='tier'] input[value='premium']").check()

  await page.locator("sk-button[type='submit']").click()

  const entries = await submitted(page)
  expect(entries).not.toBeNull()

  // `Object.fromEntries` would hide a duplicate, so assert the pairs directly.
  const asObject = Object.fromEntries(entries ?? [])
  expect(asObject).toMatchObject({
    email: "ada@example.com",
    name: "Ada Lovelace",
    bio: "Mathematician",
    plan: "pro",
    // `"accepted"`, not the platform default `"on"`: the example passes
    // `value="accepted"`. The React example pinned `"on"` in a passing test
    // because the adapter had dropped the prop; this asserts the value the
    // example actually asked for.
    terms: "accepted",
    updates: "on",
    tier: "premium",
  })

  // Every control contributed exactly one entry — the check that catches a
  // control that renders and validates but is silently absent from the
  // submission, which is the defect class this file exists to find.
  expect((entries ?? []).map(([name]) => name).sort()).toEqual([
    "bio",
    "email",
    "name",
    "plan",
    "terms",
    "tier",
    "updates",
  ])
})

test("an unchecked box and an off switch are withheld, not submitted empty", async ({ page }) => {
  await page.locator("sk-input[name='email'] input[data-slot='control']").fill("ada@example.com")
  await page.locator("sk-button[type='submit']").click()

  const names = ((await submitted(page)) ?? []).map(([name]) => name)
  // The platform withholds an unchecked checkbox and an off switch entirely.
  // Submitting `terms=""` would be a different, and wrong, claim.
  expect(names).not.toContain("terms")
  expect(names).not.toContain("updates")
})

test("the browser blocks submission on a required field, and Vue does not", async ({ page }) => {
  // `email` is required. Submit with it empty: native constraint validation
  // stops the submit event, so the app's own handler never runs and the output
  // still reads "not submitted". A Vue re-implementation of validation would
  // run the handler and produce entries.
  await page.locator("sk-button[type='submit']").click()
  await expect(page.locator("[data-testid='result']")).toHaveText("not submitted")

  // And the element reports the constraint itself.
  const valid = await page.evaluate(
    () => document.querySelector("sk-input[name='email']")?.matches(":invalid") ?? null,
  )
  expect(valid).toBe(true)
})

test("reset restores the initial values the adapter rendered", async ({ page }) => {
  const email = page.locator("sk-input[name='email'] input[data-slot='control']")
  await email.fill("changed@example.com")
  await page.locator("sk-checkbox[name='terms'] .sk-checkbox__control").click()

  await page.locator("sk-button[type='reset']").click()

  await expect(email).toHaveValue("")
  const entries = await submitted(page)
  expect((entries ?? []).map(([name]) => name)).not.toContain("terms")
})

test("the value reaches FormData, not Vue state", async ({ page }) => {
  // Fill through the DOM, then read the form directly without submitting. This
  // distinguishes "the browser knows the value" from "Vue was told about it":
  // nothing here dispatches a Vue event.
  await page.locator("sk-input[name='name'] input[data-slot='control']").fill("Grace Hopper")
  const value = await page.evaluate(() => {
    const form = document.querySelector("form[data-testid='form']")
    return form === null ? null : new FormData(form as HTMLFormElement).get("name")
  })
  expect(value).toBe("Grace Hopper")
})

test("the Vue-rendered controls carry the brutalist chrome", async ({ page }) => {
  // The adapter must not bypass the stylesheet: a component that renders through
  // Vue is the same element, so it gets the same 3px stroke and zero radius.
  // This is the cross-check that the example is exercising the real build.
  const style = await page.locator("sk-button[type='submit']").evaluate((el) => {
    const cs = getComputedStyle(el)
    return { borderWidth: cs.borderTopWidth, radius: cs.borderTopLeftRadius }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.radius).toBe("0px")
})
