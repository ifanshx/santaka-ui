import { expect, test } from "@playwright/test"

/**
 * Avatar Group browser tests.
 *
 * The two claims worth testing are both about the overflow: it has to be a count
 * with a name rather than a nameless circle, and the avatars past `max` have to
 * leave the accessibility tree — otherwise a screen reader reads five names while
 * the page shows three plus "+2".
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("the group is a named group, not a list", async ({ page }) => {
  // A list would announce "list, 5 items" and walk the reader through each one.
  // These are people; one sentence is more useful than five stops.
  const group = page.locator("#group-named")
  await expect(group).toHaveAttribute("role", "group")
  await expect(group).toHaveAttribute("aria-label", "Assigned to")
})

test("an unnamed group carries no role at all", async ({ page }) => {
  // A bare `role="group"` with no label is skipped by most screen readers, so
  // asserting one here would be a claim nothing backs. Better no role than a
  // role that announces nothing — the same call `sk-avatar` makes when it has
  // neither a name nor initials.
  const unnamed = page.locator("#group-unnamed")
  await expect(unnamed).not.toHaveAttribute("role", "group")
})

test("the overflow is a count with a name, not a nameless circle", async ({ page }) => {
  const overflow = page.locator('#group-named [data-slot="overflow"]')
  await expect(overflow).toHaveText("+2")
  // The visible text is "+2", which alone announces as a symbol; the label is
  // what makes it meaningful.
  await expect(overflow).toHaveAttribute("aria-label", "2 more")
})

test("avatars past max leave the accessibility tree", async ({ page }) => {
  // Five avatars, `max=3`: exactly two are hidden, and `display: none` is what
  // removes them from the tree rather than merely from the layout.
  const hidden = page.locator("#group-named sk-avatar[data-overflow-hidden]")
  const shown = page.locator("#group-named sk-avatar:not([data-overflow-hidden])")
  await expect(hidden).toHaveCount(2)
  await expect(shown).toHaveCount(3)

  for (const avatar of await hidden.all()) {
    await expect(avatar).toBeHidden()
  }
})

test("max=0 shows everyone and renders no overflow", async ({ page }) => {
  const group = page.locator("#group-no-overflow")
  await expect(group.locator("sk-avatar")).toHaveCount(2)
  await expect(group.locator('[data-slot="overflow"]')).toHaveCount(0)
})

test("the stack overlaps by a negative inline margin, not absolute positioning", async ({
  page,
}) => {
  // Absolute positioning would break reflow at narrow widths and would not
  // mirror in RTL, since a `left` offset does not flip. `margin-inline-start`
  // does — which is ADR-016's requirement, not a preference.
  const first = page.locator("#group-named sk-avatar").first()
  const second = page.locator("#group-named sk-avatar").nth(1)

  const firstBox = await first.boundingBox()
  const secondBox = await second.boundingBox()

  // Overlapping: the second avatar starts before the first one ends.
  expect(secondBox!.x).toBeLessThan(firstBox!.x + firstBox!.width)

  const marginStart = await second.evaluate((el) => getComputedStyle(el).marginInlineStart)
  expect(parseFloat(marginStart)).toBeLessThan(0)
})

test("the first avatar is painted on top", async ({ page }) => {
  // Without an explicit stacking order the overlap direction looks accidental,
  // and in RTL — where the visual order is already reversed — it looks wrong.
  const zIndexOf = async (nth: number) =>
    page
      .locator("#group-named sk-avatar")
      .nth(nth)
      .evaluate((el) => getComputedStyle(el).zIndex)

  expect(await zIndexOf(0)).toBe("1")
  expect(await zIndexOf(1)).toBe("0")
})
