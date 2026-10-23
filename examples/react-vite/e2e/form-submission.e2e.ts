import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

/**
 * The React adapter submits through a plain `<form>`.
 *
 * This is the browser half of docs/ARCHITECTURE.md section 16's gate — "Every form control
 * submits through a plain `<form>` in React, Vue, and the universal package" —
 * and it is the half that did not exist. The React adapter's unit tests run
 * under jsdom, which has no form submission and no form-associated custom
 * element implementation, so they could only ever assert that `name` reached the
 * element's attributes. Whether the browser then *submits* the control is a
 * different claim, and it needed a real browser.
 *
 * It found a real defect: `Checkbox`, `Switch`, and `Select` dropped `name`, so
 * an unnamed form-associated element contributed nothing to `FormData`. The
 * adapters rendered, validated, and reported values, and the form submitted
 * without them. The fix is in `packages/react/src/{checkbox,switch,select}.tsx`;
 * `packages/react/src/form-name.test.tsx` catches the regression in jsdom, and
 * this file is the proof that the browser agrees.
 *
 * Every value below is read from the browser's own `FormData`, not from React
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
  await page.waitForSelector("sk-switch .sk-switch__control")
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await waitForUpgrade(page)
})

test("renders every control as a custom element, not a native input", async ({ page }) => {
  // The React adapter must not substitute native elements: if it did, the FACE
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
    // `value="accepted"`, and this assertion previously read `"on"` because the
    // adapter dropped the prop and the element fell back to its default. The
    // wrong value was pinned in a passing test — the exact failure mode this
    // file exists to prevent, caught here on the adapter side rather than in the
    // element.
    terms: "accepted",
    updates: "on",
    tier: "premium",
  })

  // Every control contributed exactly one entry — the check that catches a
  // control that renders and validates but is silently absent from the
  // submission, which is the defect this file was written to find.
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

test("the browser blocks submission on a required field, and React does not", async ({ page }) => {
  // `email` is required. Submit with it empty: native constraint validation
  // stops the submit event, so the app's own handler never runs and the output
  // still reads "not submitted". A React re-implementation of validation would
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

test("the value reaches FormData, not React state", async ({ page }) => {
  // Fill through the DOM, then read the form directly without submitting. This
  // distinguishes "the browser knows the value" from "React was told about it":
  // nothing here dispatches a React event.
  await page.locator("sk-input[name='name'] input[data-slot='control']").fill("Grace Hopper")
  const value = await page.evaluate(() => {
    const form = document.querySelector("form[data-testid='form']")
    return form === null ? null : new FormData(form as HTMLFormElement).get("name")
  })
  expect(value).toBe("Grace Hopper")
})

test("the React-rendered controls carry the brutalist chrome", async ({ page }) => {
  // The adapter must not bypass the stylesheet: a component that renders through
  // React is the same element, so it gets the same 3px stroke and zero radius.
  // This is the cross-check that the example is exercising the real build.
  const style = await page.locator("sk-button[type='submit']").evaluate((el) => {
    const cs = getComputedStyle(el)
    const token = getComputedStyle(document.documentElement).getPropertyValue("--sk-radius-md").trim()
    return { borderWidth: cs.borderTopWidth, radius: cs.borderTopLeftRadius, token }
  })
  expect(style.borderWidth).toBe("3px")
  // Asserted against the token, not a literal: chrome is a small non-zero radius
  // now, and a copy of the number here would go stale when the token moves.
  expect(style.token, "the radius token is published").not.toBe("")
  expect(style.radius, "the control reads the radius token").toBe(style.token)
})
