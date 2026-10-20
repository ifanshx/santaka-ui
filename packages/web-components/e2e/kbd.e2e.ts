import { expect, test } from "@playwright/test"

/**
 * Kbd browser tests.
 *
 * The claim this component makes is narrow and easy to fake: that it renders a
 * real `<kbd>` element rather than a `<span>` styled to look like one. Every
 * test below is about that claim or about the chrome that must survive it.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("renders a real kbd element in the light DOM", async ({ page }) => {
  // Scoped mode (ADR-011) renders the `<kbd>` inside the host with no shadow
  // root, so it is the light DOM the consumer's document structure sees. A
  // styled `<span>` would pass every visual check below and fail this one,
  // which is why it is the first assertion.
  const keys = page.locator("sk-kbd kbd")
  await expect(keys.first()).toBeVisible()
  expect(await keys.count()).toBeGreaterThan(0)

  for (const key of await keys.all()) {
    expect(await key.evaluate((el) => el.tagName.toLowerCase())).toBe("kbd")
  }
})

test("the kbd is in the accessibility tree as key input, not a bare span", async ({ page }) => {
  // The whole reason the component exists. `<kbd>` is what lets assistive
  // technology distinguish "Shift" the key from "shift" the word; a span with
  // the same pixels carries no such distinction.
  const spurious = page.locator("sk-kbd span")
  expect(await spurious.count()).toBe(0)

  const key = page.locator("sk-kbd kbd").first()
  await expect(key).toHaveText("Ctrl")
})

test("the brutalist stroke and hard shadow apply", async ({ page }) => {
  const key = page.locator("sk-kbd kbd").first()
  const style = await key.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      borderWidth: cs.borderTopWidth,
      boxShadow: cs.boxShadow,
      radius: cs.borderTopLeftRadius,
    }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.boxShadow).not.toBe("none")
  // Hard offset shadow, zero blur: the brutalist signature Chrome carries.
  expect(style.boxShadow).toMatch(/px 0px/)
  expect(style.radius).toBe("0px")
})

test("the key is set in the monospace stack", async ({ page }) => {
  // Functional, not decorative: "l", "1", and "I" are the same glyph in most UI
  // faces, and a shortcut is a string a reader copies by eye.
  const family = await page
    .locator("sk-kbd kbd")
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family.toLowerCase()).toMatch(/mono/)
})

test("size reflects to the host and changes the type step", async ({ page }) => {
  const md = page.locator("sk-kbd[data-size='md']").first()
  const sm = page.locator("sk-kbd[data-size='sm']").first()
  await expect(md).toHaveAttribute("data-slot", "kbd")
  await expect(sm).toHaveAttribute("data-size", "sm")

  const fontSize = async (locator: typeof md) =>
    locator.locator("kbd").evaluate((el) => getComputedStyle(el).fontSize)

  const mdSize = await fontSize(md)
  const smSize = await fontSize(sm)
  expect(smSize).not.toBe(mdSize)
})

test("a shortcut inside a sentence stays inline", async ({ page }) => {
  // The box must not force the line box open: a shortcut is read inline with
  // the copy describing it.
  const inline = page.locator("p sk-kbd").first()
  await expect(inline).toBeVisible()
  const display = await inline.evaluate((el) => getComputedStyle(el).display)
  expect(display).toBe("inline-flex")
})
