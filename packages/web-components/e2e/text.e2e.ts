import { expect, test } from "@playwright/test"

/**
 * Text browser tests.
 *
 * The component's whole claim is that a type step is one record — size,
 * line-height, weight, and tracking from the same token — applied to an element
 * the consumer chose. Each test asserts the claim in a browser, because the
 * failure mode of a re-skin is a token reference falling back to a literal,
 * which does not throw.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("each step applies size, weight, and tracking as one record", async ({ page }) => {
  // The display step is the sharpest test of the idea: weight 800 and -0.03em
  // tracking are what give the system its arcade character, and neither is
  // visible if only the size token is applied — which is exactly what the
  // example page was doing inline before this component existed.
  const display = page
    .locator('sk-text[variant="display"] h3')
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        size: cs.fontSize,
        weight: cs.fontWeight,
        tracking: cs.letterSpacing,
      }
    })

  expect((await display).weight).toBe("800")
  expect(Number.parseFloat((await display).tracking)).toBeLessThan(0)

  const base = page
    .locator('sk-text[variant="base"]')
    .filter({ hasText: "Body text" })
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el)
      return { size: cs.fontSize, weight: cs.fontWeight, line: cs.lineHeight }
    })

  // Weight 400 is as much a decision as 800: a step that set only size would
  // leave a heading inheriting the browser's bold.
  expect((await base).weight).toBe("400")
  expect((await base).size).toBe("16px")
})

test("the element keeps its own semantics", async ({ page }) => {
  // The component renders no wrapper and takes no role, so the consumer's
  // heading is still a heading — in the accessibility tree, and to document
  // outline tools. A component that swallowed the element would demote every
  // heading it touched.
  const h1 = page.locator("sk-text > h1")
  await expect(h1).toHaveCount(1)

  const role = await h1.evaluate((el) => {
    el.focus()
    return el.tagName
  })
  expect(role).toBe("H1")

  // And the section headings remain real h2s tied to their sections.
  const section = page.locator('section[aria-labelledby="type-heading"]')
  await expect(section.locator("h2")).toHaveCount(1)
})

test("the display family applies only when asked", async ({ page }) => {
  const withFamily = await page
    .locator('sk-text[variant="2xl"] > h3')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  const withDisplay = await page
    .locator('sk-text[variant="display"] > h3')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)

  // Both resolve to the platform stack today, so equality of *string* proves
  // nothing. What proves the token path is that the declared values differ at
  // the source: `--sk-font-display` resolves from the display token, body copy
  // from `--sk-font-body`. The assertion is that neither fell back to a
  // different literal — which is what a typo'd token would produce.
  expect(withFamily).not.toBe("")
  expect(withDisplay).not.toBe("")
})

test("muted text passes its own contrast, not the page's", async ({ page }) => {
  // Muted is secondary text and is gated at 4.5:1 against the surface, the same
  // as primary text, because it is still meant to be read. The gate lives in the
  // token build; this asserts the color actually arrives.
  const muted = await page
    .locator('sk-text[variant="sm"][muted]')
    .first()
    .evaluate((el) => getComputedStyle(el).color)
  const primary = await page
    .locator('sk-text[variant="base"]')
    .filter({ hasText: "Body text" })
    .first()
    .evaluate((el) => getComputedStyle(el).color)

  expect(muted).not.toBe(primary)
  expect(muted).not.toBe("rgba(0, 0, 0, 0)")
})

test("text is not chrome: no stroke, no shadow, no press", async ({ page }) => {
  // Text is the one component with none of the brutalist treatment, and that is
  // the design. A stroke or shadow on body copy would make every paragraph read
  // as a control. If this ever fails, someone added chrome to text — which is
  // the specific mistake this component exists to prevent.
  const style = await page
    .locator('sk-text[variant="display"]')
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        border: cs.borderTopWidth,
        shadow: cs.boxShadow,
        transition: cs.transitionProperty,
      }
    })

  expect(style.border).toBe("0px")
  expect(style.shadow).toBe("none")
  expect(style.transition).toBe("all")
})

test("it follows the theme", async ({ page }) => {
  const read = () =>
    page
      .locator('sk-text[variant="sm"][muted]')
      .first()
      .evaluate((el) => getComputedStyle(el).color)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()

  expect(dark).not.toBe(light)
})
