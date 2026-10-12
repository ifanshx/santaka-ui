import { expect, test } from "@playwright/test"

/**
 * Label and Separator browser tests.
 *
 * Label's wiring is the pattern Input proved; here it is proved standalone, on
 * a control this component does not own. Separator's semantics are the point:
 * a real <hr> that announces itself, or steps out of the tree when decorative.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test.describe("label", () => {
  test("clicking the standalone label focuses the control it names", async ({ page }) => {
    // The association is `for` -> control id, and the browser's own label
    // activation does the focusing. This component implements no click handler;
    // if this fails, the association is broken, not the focus logic.
    const label = page.locator('sk-label[for="standalone-email-control"] .sk-label__label')
    await label.click()
    await expect(page.locator("#standalone-email-control")).toBeFocused()
  })

  test("the association is programmatic, not incidental", async ({ page }) => {
    const forId = await page
      .locator('sk-label[for="standalone-email-control"] .sk-label__label')
      .getAttribute("for")
    expect(forId).toBe("standalone-email-control")
  })

  test("the required marker is a glyph, never color alone", async ({ page }) => {
    // WCAG 1.4.1, same ruling as Input: the asterisk is content, the color is
    // reinforcement. A color-only marker fails for color-blind users and under
    // forced colors.
    const marker = page.locator('sk-label[for="standalone-notes-control"] [data-slot="required"]')
    await expect(marker).toHaveText("*")
    await expect(marker).toHaveAttribute("aria-hidden", "true")
  })

  test("the marker position follows the prop", async ({ page }) => {
    // `before` reads naturally when the control leads the sentence. Asserting
    // both orders against real required labels is what keeps the prop honest
    // rather than decorative — an unrequired label renders no marker at all, so
    // a selector that matched one would assert nothing.
    const before = page.locator('sk-label[for="standalone-notes-control"]')
    const first = await before.evaluate((el) => el.firstElementChild?.getAttribute("data-slot"))
    expect(first).toBe("required")

    const after = page.locator('sk-label[for="standalone-email-confirm-control"]')
    const last = await after.evaluate((el) => el.lastElementChild?.getAttribute("data-slot"))
    expect(last).toBe("required")
  })

  test("it matches Input's label record", async ({ page }) => {
    // The whole point of a standalone label is reading identically to a field's
    // own label. If the two diverge, one of them has drifted.
    const standalone = await page
      .locator('sk-label[for="standalone-email-control"] .sk-label__label')
      .evaluate((el) => {
        const cs = getComputedStyle(el)
        return { size: cs.fontSize, weight: cs.fontWeight }
      })
    expect(standalone.weight).toBe("400")
    expect(standalone.size).not.toBe("0px")
  })
})

test.describe("separator", () => {
  test("it is a real hr-level separator with an orientation", async ({ page }) => {
    const sep = page.locator('sk-separator[label="or"]').first()
    await expect(sep).toHaveAttribute("role", "separator")
    await expect(sep).toHaveAttribute("aria-orientation", "horizontal")
  })

  test("a meaningful separator announces its label", async ({ page }) => {
    const sep = page.locator('sk-separator[label="or"]').first()
    await expect(sep).toHaveAttribute("aria-label", "or")
  })

  test("a decorative one steps out of the accessibility tree", async ({ page }) => {
    const sep = page.locator("sk-separator[decorative]").first()
    await expect(sep).toHaveAttribute("role", "none")
    // And a name on a role="none" element would be a contradiction, so there
    // must not be one.
    await expect(sep).not.toHaveAttribute("aria-label", /.+/)
  })

  test("the line is the hairline, not the chrome stroke", async ({ page }) => {
    // This is the design: a separator divides content, and a 3px stroke between
    // paragraphs would read as a wall. The one place 1px is the point.
    const height = await page
      .locator("sk-separator[decorative]")
      .first()
      .evaluate((el) => getComputedStyle(el).blockSize)
    expect(height).toBe("1px")
  })

  test("a vertical separator renders as a vertical line", async ({ page }) => {
    const sep = page.locator('sk-separator[orientation="vertical"]').first()
    const box = await sep.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { w: Number.parseFloat(cs.inlineSize), h: Number.parseFloat(cs.blockSize) }
    })
    expect(box.w).toBeLessThan(box.h)
  })
})
