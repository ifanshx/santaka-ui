import { expect, test } from "@playwright/test"

/**
 * Banner browser tests.
 *
 * The component is easy to build and easy to get wrong in one specific way:
 * `role="banner"` is the ARIA name for the *site header*, one per page. Using it
 * here would collide with the consumer's real `<header>`. The tests below start
 * there and then cover the geometry difference from `sk-alert`.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("it is a region, not the ARIA banner landmark", async ({ page }) => {
  // `role="banner"` means the site header in ARIA and is one-per-page. This
  // component spans the top of a page without claiming that role, so a
  // consumer's real <header> does not end up with a second "banner" landmark.
  const banner = page.locator("#banner-named")
  await expect(banner).toHaveAttribute("role", "region")
  await expect(banner).not.toHaveAttribute("role", "banner")
})

test("the region is named, which is what makes it a landmark at all", async ({ page }) => {
  // ARIA only exposes a `region` as a landmark when it has an accessible name.
  // An unnamed one is invisible to landmark navigation, so this is the
  // assertion that the component is reachable rather than merely present.
  const named = page.locator("#banner-named")
  await expect(named).toHaveAttribute("aria-label", "Service status")

  // And the unnamed case is left alone rather than given a made-up label: a
  // default like "banner" would announce the designer's word, not the message.
  const unnamed = page.locator("#banner-unnamed")
  await expect(unnamed).toHaveAttribute("role", "region")
  await expect(unnamed).not.toHaveAttribute("aria-label", /.+/)
})

test("a consumer-set role is never overwritten", async ({ page }) => {
  // Same rule as sk-alert: a custom live region or landmark must survive.
  const role = await page.evaluate(() => {
    const el = document.createElement("sk-banner")
    el.setAttribute("role", "log")
    el.id = "banner-custom-role"
    document.body.append(el)
    return el.getAttribute("role")
  })
  expect(role).toBe("log")
})

test("fullWidth spans its container; inline keeps the box chrome", async ({ page }) => {
  // The material is the same; the difference is the shadow and side borders,
  // because a shadow makes a box read as floating above the page and a banner
  // spans the page instead.
  const strip = page.locator("#banner-named")
  const inline = page.locator("#banner-inline")

  await expect(strip).toHaveAttribute("data-full-width", "true")
  await expect(inline).toHaveAttribute("data-full-width", "false")

  const stripShadow = await strip.evaluate((el) => getComputedStyle(el).boxShadow)
  const inlineShadow = await inline.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(stripShadow).toBe("none")
  expect(inlineShadow).not.toBe("none")
})

test("the glyph is decorative and hidden from assistive technology", async ({ page }) => {
  // It repeats what the fill and the text already say; it exists so colour is
  // never the only signal (WCAG 1.4.1).
  const icon = page.locator('#banner-named [data-slot="icon"]')
  await expect(icon).toHaveAttribute("aria-hidden", "true")
})

test("an empty actions row is removed rather than left as a gap", async ({ page }) => {
  // `:empty` matches because CSS ignores the comment nodes scoped mode leaves
  // behind — the same rule sk-card's footer relies on, and worth asserting here
  // because a leftover flex item would push the content off-centre.
  const empty = page.locator('#banner-unnamed [data-slot="actions"]')
  await expect(empty).toHaveCSS("display", "none")

  const filled = page.locator('#banner-named [data-slot="actions"]')
  await expect(filled).not.toHaveCSS("display", "none")
})

test("variant sets a fill and a foreground measured together", async ({ page }) => {
  for (const id of ["banner-named", "banner-unnamed", "banner-inline"]) {
    const style = await page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(style, `${id} background`).not.toBe("rgba(0, 0, 0, 0)")
  }
})
