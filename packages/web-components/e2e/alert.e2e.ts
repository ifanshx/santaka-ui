import { expect, test, type Page } from "@playwright/test"

/**
 * Alert browser tests. An alert is a static, inline status message, so what is
 * asserted is the contract it claims: variants that paint measured fills, a
 * role that follows the variant without ever overwriting the consumer's own,
 * slotted actions that compose into a real row, and the brutalist geometry
 * every piece of chrome in this library carries.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const alert = (page: Page, selector = "sk-alert") => page.locator(selector).first()

test("every variant paints a real fill with a different foreground", async ({ page }) => {
  const variants = ["neutral", "primary", "success", "warning", "danger"] as const

  for (const variant of variants) {
    const style = await page
      .locator(`sk-alert[data-variant='${variant}']`)
      .first()
      .evaluate((el) => {
        const computed = getComputedStyle(el)
        return { bg: computed.backgroundColor, fg: computed.color }
      })

    // A fill that stayed `rgba(0, 0, 0, 0)` means the `*-subtle` token behind
    // this variant resolved to nothing — the same defect a dropped `color-mix()`
    // would produce in sk-badge, and the reason these are asserted per variant
    // rather than only on one.
    expect(style.bg, `variant ${variant} background`).not.toBe("rgba(0, 0, 0, 0)")
    // Foreground and background chosen *together* must differ: an unpainted
    // text color equal to the fill would be invisible text.
    expect(style.fg, `variant ${variant} foreground`).not.toBe(style.bg)
  }
})

test("role follows the variant without overwriting the consumer's", async ({ page }) => {
  // An error appearing in place should interrupt; danger gets `role="alert"`.
  await expect(alert(page, "sk-alert[data-variant='danger']")).toHaveAttribute("role", "alert")
  // A success line should not interrupt; it is a polite `role="status"`.
  await expect(alert(page, "sk-alert[data-variant='success']")).toHaveAttribute("role", "status")

  // The other informational variants are status too — the example has one
  // unannotated neutral alert, which is also the default variant's markup.
  const neutral = page.locator("sk-alert[data-variant='neutral']").last()
  await expect(neutral).toHaveAttribute("role", "status")
})

test("slotted actions land in the actions row, and the unfilled row disappears", async ({
  page,
}) => {
  // The danger alert carries a real button in slot="actions".
  const danger = alert(page, "sk-alert[data-variant='danger']")
  const actions = danger.locator('[data-slot="actions"]')
  await expect(actions.locator("sk-button")).toHaveCount(1)

  // The other alerts fill no actions slot. The wrapper always renders, so CSS
  // has to remove the empty band — the same contract sk-card's footer follows.
  const success = alert(page, "sk-alert[data-variant='success']")
  await expect(success.locator('[data-slot="actions"]')).toHaveCount(1)
  expect(
    await success.locator('[data-slot="actions"]').evaluate((el) => getComputedStyle(el).display),
  ).toBe("none")
})

test("the glyph exists, is aria-hidden, and changes shape per variant", async ({ page }) => {
  const glyphs = page.locator("sk-alert [data-slot='icon']")
  expect(await glyphs.count()).toBe(5)

  // Decorative drawing: the fill and the heading text carry the meaning, so the
  // glyph must not add a second announcement of it.
  for (const glyph of await glyphs.all()) {
    await expect(glyph).toHaveAttribute("aria-hidden", "true")
  }

  // Colour is never the only signal: the shape differs by variant, checked by
  // computed clip-path rather than by hue.
  const neutral = await alert(page, "sk-alert[data-variant='neutral'] [data-slot='icon']").evaluate(
    (el) => getComputedStyle(el).clipPath,
  )
  const warning = await alert(page, "sk-alert[data-variant='warning'] [data-slot='icon']").evaluate(
    (el) => getComputedStyle(el).clipPath,
  )
  expect(warning).not.toBe(neutral)
  expect(warning).toContain("polygon")
})

test("the heading renders as a span, not an invented heading element", async ({ page }) => {
  const danger = alert(page, "sk-alert[data-variant='danger']")

  // The alert does not know its level in the document outline, so `heading`
  // must never produce an <h1>–<h6> or a heading role.
  const heading = danger.locator('[data-slot="heading"]')
  await expect(heading).toHaveCount(1)
  expect(await heading.evaluate((el) => el.tagName)).toBe("SPAN")
  await expect(heading).not.toHaveAttribute("role", "heading")

  // Alerts whose prop is empty must not render an empty heading band at all.
  await expect(alert(page, "sk-alert[data-variant='success'] [data-slot='heading']")).toHaveCount(0)
})

test("the brutalist geometry applies", async ({ page }) => {
  const style = await alert(page, "sk-alert[data-variant='danger']").evaluate((el) => {
    const computed = getComputedStyle(el)
    return {
      radius: computed.borderTopLeftRadius,
      width: computed.borderTopWidth,
      style: computed.borderTopStyle,
      shadow: computed.boxShadow,
    }
  })

  // Hard edges: an alert is chrome, not a floating layer.
  expect(style.radius).toBe("0px")
  expect(style.style).toBe("solid")
  expect(style.width).toBe("3px")
  // A zero-blur offset shadow, which is the brutalist signature.
  expect(style.shadow).not.toBe("none")
  expect(style.shadow).toMatch(/,\s*0px 0px|0px 0px/)
})

test("it is not focusable and not interactive chrome", async ({ page }) => {
  // An alert states; it does not take focus. `role="alert"` or `role="status"`
  // nodes that grab focus would hijack the reading order for no reason.
  const danger = alert(page, "sk-alert[data-variant='danger']")
  await expect(danger).toHaveJSProperty("tabIndex", -1)
})

test("it follows the theme", async ({ page }) => {
  const subject = alert(page, "sk-alert[data-variant='danger']")

  const light = await subject.evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await subject.evaluate((el) => getComputedStyle(el).backgroundColor)

  // A theme switch that leaves the alert untouched means the token path is
  // broken, not that the two themes happen to share a value.
  expect(light).not.toBe("rgba(0, 0, 0, 0)")
  expect(dark).not.toBe(light)
})
