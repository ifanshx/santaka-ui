import { expect, test, type Page } from "@playwright/test"

/**
 * Card browser tests. A card is a surface, so most of what a card does cannot be
 * asserted from markup alone — it has no role, no focus, and no state. What can
 * be observed is the geometry it paints, that its slots compose, and that it
 * stays out of the accessibility tree's way.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const card = (page: Page, selector = "sk-card") => page.locator(selector).first()

test("it renders slots, not a wrapper div", async ({ page }) => {
  const first = card(page)
  await expect(first).toBeVisible()
  // The consumer's own <h2 slot="header"> wins over the title prop, so the card
  // has to have projected it rather than shadowed it.
  await expect(first.locator("h2[slot='header']")).toHaveCount(1)
  await expect(first.locator('[data-slot="body"]')).toHaveCount(1)
})

test("the footer slot is separated by a rule, not just a gap", async ({ page }) => {
  const first = card(page)
  await expect(first.locator("sk-badge[slot='footer']")).toHaveCount(1)
  await expect(first.locator("sk-button[slot='footer']")).toHaveCount(1)

  // A footer's boundary has to be findable by the eye. A gap alone is not one,
  // so this asserts an actually drawn rule on the footer wrapper.
  const rule = await first
    .locator('[data-slot="footer"]')
    .evaluate((el) => getComputedStyle(el).borderBlockStartWidth)
  expect(rule).not.toBe("0px")
})

test("slot elements are not in the light DOM, so no style may target one", async ({ page }) => {
  // Scoped mode (ADR-011) strips the <slot> element and relocates the assigned
  // nodes. This is not an implementation detail to be ignored: a selector like
  // `slot[name="footer"]` matches nothing and its rules silently never apply.
  // The first version of sk-card.css styled exactly that and no test noticed
  // until one waited for a rule that was never going to be drawn.
  const slots = await page.evaluate(() =>
    Array.from(document.querySelectorAll("sk-card slot")).map((s) => s.getAttribute("name")),
  )
  expect(slots).toHaveLength(0)

  // Everything that must be styled therefore has to hang off a real wrapper.
  await expect(card(page).locator('[data-slot="body"]')).toHaveCount(1)
  await expect(card(page).locator('[data-slot="footer"]')).toHaveCount(1)
})

test("an unfilled slot renders nothing", async ({ page }) => {
  // The bare card in the example fills neither header nor footer. If either
  // rendered unconditionally, this card would carry an empty bordered band.
  const bare = card(page, 'sk-card[variant="bare"]')
  await expect(bare.locator("h2[slot='header']")).toHaveCount(0)
  await expect(bare.locator("[data-slot='header']")).toHaveCount(0)

  // The footer wrapper always exists, so the empty case has to be removed by CSS
  // rather than by the template. A bare rule drawn across an empty band is the
  // defect this guards against.
  const footer = bare.locator('[data-slot="footer"]')
  await expect(footer).toHaveCount(1)
  expect(await footer.evaluate((el) => getComputedStyle(el).display)).toBe("none")
})

test("the brutalist geometry applies", async ({ page }) => {
  const first = card(page)
  const style = await first.evaluate((el) => {
    const computed = getComputedStyle(el)
    return {
      radius: computed.borderTopLeftRadius,
      width: computed.borderTopWidth,
      shadow: computed.boxShadow,
    }
  })

  // Hard edges: a card is chrome, not a floating layer.
  expect(style.radius, "chrome takes its radius from --sk-radius-md").toBe(
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--sk-radius-md").trim()),
  )
  expect(style.width).toBe("3px")
  // A zero-blur offset shadow, which is the brutalist signature.
  expect(style.shadow).not.toBe("none")
  expect(style.shadow).toMatch(/,\s*0px 0px|0px 0px/)
})

test("it carries no role and takes no focus", async ({ page }) => {
  const first = card(page)

  // A card is a surface, not a control. If it ever gained a role or a tabindex,
  // it would appear in a screen reader's control list as something it is not.
  await expect(first).not.toHaveAttribute("role", /.+/)
  await expect(first).toHaveJSProperty("tabIndex", -1)

  // The footer holds a real button, so the card's content is reachable — but the
  // card element itself is not a tab stop. Counting >= 0 would assert nothing.
  const stops = await first.evaluate(
    (el) => el.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])').length,
  )
  expect(stops).toBeGreaterThan(0)

  // And nothing inside may have been promoted to a heading the consumer did not
  // ask for: the card must not invent document structure.
  const headings = await first.evaluate((el) => el.querySelectorAll("[role='heading']").length)
  expect(headings).toBe(0)
})

test("it is reachable by name from the accessibility tree", async ({ page }) => {
  // The card's own content supplies its accessible name. What must not happen is
  // the card swallowing it — a card that collapsed its children into one
  // unlabelled node would read as an empty box.
  const snapshot = await page.locator('sk-card:has(h2[slot="header"])').first().ariaSnapshot()
  expect(snapshot).toContain("Deployment")
})

test("outlined drops the fill, bare drops fill and shadow", async ({ page }) => {
  const read = async (selector: string) =>
    card(page, selector).evaluate((el) => {
      const computed = getComputedStyle(el)
      return { background: computed.backgroundColor, shadow: computed.boxShadow }
    })

  const filled = await read("sk-card")
  const outlined = await read('sk-card[variant="outlined"]')
  const bare = await read('sk-card[variant="bare"]')

  expect(filled.background).not.toBe("rgba(0, 0, 0, 0)")
  expect(outlined.background).toBe("rgba(0, 0, 0, 0)")
  expect(bare.background).toBe("rgba(0, 0, 0, 0)")
  expect(outlined.shadow).not.toBe("none")
  expect(bare.shadow).toBe("none")
})

test("padding changes the inset, and none removes it", async ({ page }) => {
  const inset = (selector: string) =>
    card(page, selector).evaluate((el) => getComputedStyle(el).paddingTop)

  // `padding="none"` is the bare card in the example, and it must be truly zero.
  expect(await inset('sk-card[variant="bare"][padding="none"]')).toBe("0px")

  // The other two cards use the default `md`, which must be a real inset. The
  // earlier version of this test compared one selector to itself and passed
  // whatever the component did, which is not a test.
  const filled = await inset("sk-card")
  const outlined = await inset('sk-card[variant="outlined"]')
  expect(filled).not.toBe("0px")
  expect(outlined).toBe(filled)
})

test("it follows the theme", async ({ page }) => {
  const first = card(page, 'sk-card[padding="md"]')
  const read = () => first.evaluate((el) => getComputedStyle(el).backgroundColor)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()

  // A theme switch that leaves the card untouched means the token path is broken,
  // not that the two themes happen to share a value. The filled card is the
  // subject here: `outlined` and `bare` are transparent in both themes, so
  // asserting on them would pass against a broken token pipeline.
  expect(light).not.toBe("rgba(0, 0, 0, 0)")
  expect(dark).not.toBe(light)
})
