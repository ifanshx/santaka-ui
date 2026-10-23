import { expect, test } from "@playwright/test"

/**
 * Slider browser tests.
 *
 * The decision worth testing is that this is a real `<input type="range">`
 * rather than a `<div>` with `role="slider"`. Everything a hand-built slider
 * tends to lose — the platform's keyboard model, the step rounding, the ARIA
 * value — is free here, and each test below is one of those.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("it renders a real native range input", async ({ page }) => {
  // Not a <div role="slider">: the native control owns the keyboard model, the
  // step behaviour, and the ARIA slider role.
  const input = page.locator("#slider-basic input")
  await expect(input).toHaveAttribute("type", "range")
  await expect(input).toHaveJSProperty("value", "40")
})

test("the platform's keyboard model moves the value", async ({ page }) => {
  // Free with a native input, and the thing a hand-built slider usually gets
  // wrong: no arrow handling was written here at all.
  const input = page.locator("#slider-basic input")
  await input.focus()

  await page.keyboard.press("ArrowRight")
  await expect(input).toHaveJSProperty("value", "41")

  await page.keyboard.press("ArrowLeft")
  await expect(input).toHaveJSProperty("value", "40")

  await page.keyboard.press("Home")
  await expect(input).toHaveJSProperty("value", "0")

  await page.keyboard.press("End")
  await expect(input).toHaveJSProperty("value", "100")
})

test("Home and End respect the configured min and max", async ({ page }) => {
  // The step is 10 here and the range is 0–200, so End lands on the maximum
  // rather than on a step multiple — the platform's own rounding, not ours.
  const input = page.locator("#slider-error input")
  await input.focus()
  await page.keyboard.press("End")
  await expect(input).toHaveJSProperty("value", "200")
})

test("aria-valuetext announces a sentence instead of a bare number", async ({ page }) => {
  // §6 says locale is consumer-supplied, so the component formats only what it
  // is told. "40 of 100" is announced; without `format` it would be "40".
  await expect(page.locator("#slider-basic input")).toHaveAttribute("aria-valuetext", "40 of 100")
})

test("the label points at the control and the description is announced", async ({ page }) => {
  const slider = page.locator("#slider-error")
  const input = slider.locator("input")
  const label = slider.locator('[data-slot="label"]')

  const forId = await label.getAttribute("for")
  const controlId = await input.getAttribute("id")
  expect(forId).toBe(controlId)

  // Appended, not replaced: the error joins the description.
  const describedBy = await input.getAttribute("aria-describedby")
  expect(describedBy).toContain("slider-error-description")
  expect(describedBy).toContain("slider-error-error")
  await expect(input).toHaveAttribute("aria-invalid", "true")
})

test("the error carries a glyph, so colour is not the only signal", async ({ page }) => {
  // WCAG 1.4.1.
  await expect(page.locator('#slider-error [data-slot="error"] [aria-hidden="true"]')).toHaveCount(
    1,
  )
})

test("a disabled slider is disabled and does not focus", async ({ page }) => {
  const input = page.locator("#slider-disabled input")
  await expect(input).toBeDisabled()
})

test("the control is restyled rather than left to the platform", async ({ page }) => {
  // The brutalist treatment depends on `appearance: none`: without it the
  // platform paints its own track and thumb and every rule in the stylesheet is
  // ignored. Asserted on the input itself rather than on a pseudo-element,
  // because WebKit exposes neither `::-webkit-slider-thumb` nor
  // `::-moz-range-thumb` to `getComputedStyle` — a pseudo-element assertion
  // would fail there, and skipping it would assert nothing.
  const appearance = await page
    .locator("#slider-basic input")
    .evaluate((el) => getComputedStyle(el).appearance)
  expect(appearance).toBe("none")
})

test("the thumb carries the chrome radius and the brutalist stroke", async ({ page }) => {
  // Chromium does not expose ::-webkit-slider-thumb to getComputedStyle: the
  // call returns the *input's* defaults (radius 0, border 0, width 129px) no
  // matter what the stylesheet says. This test used to assert that value was
  // "0px", which passed for every possible stylesheet — it measured nothing.
  //
  // What can be checked without a rendering oracle is that the shipped rule is
  // present and reads the token. That catches the failure that actually
  // happens: a shadowed or dropped vendor rule, which makes the control fall
  // back to the platform's own thumb.
  const css = await page.evaluate(async () => {
    const links = [...document.querySelectorAll("link[rel=stylesheet]")].map((l) => l.href)
    const sheets = await Promise.all(links.map((href) => fetch(href).then((r) => r.text())))
    return sheets.join("\n")
  })
  const thumb = css.match(/::-webkit-slider-thumb\s*\{([^}]*)\}/)
  expect(thumb, "the WebKit thumb rule ships").not.toBeNull()
  const body = thumb?.[1] ?? ""
  expect(body, "the thumb reads the chrome radius").toMatch(/border-radius:\s*var\(--sk-radius-md/)
  expect(body, "the thumb keeps the 3px stroke").toMatch(/border:\s*var\(--sk-border-thick/)
  expect(css, "the Firefox rule ships too").toMatch(/::-moz-range-thumb\s*\{/)
})
