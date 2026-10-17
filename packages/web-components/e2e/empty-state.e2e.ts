import { expect, test } from "@playwright/test"

/**
 * Empty-state browser tests. Like the card it borrows its position from, this
 * is a surface without a role and without focus, so what can be observed is
 * the geometry it paints, that its slots compose, and that it stays out of the
 * accessibility tree's way.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

// Locator convention shared with card.e2e.ts: select the example's own
// fixture markup, first() because a section holds exactly one default instance
// plus one bare one.

test("it renders its parts as real wrappers, not slots", async ({ page }) => {
  const first = page.locator("sk-empty-state").first()
  await expect(first).toBeVisible()
  // Scoped mode (ADR-011) removes the <slot> element, so every part must hang
  // off a real wrapper with a data-slot hook.
  for (const part of ["icon", "content", "body", "actions"]) {
    await expect(first.locator(`[data-slot="${part}"]`)).toHaveCount(1)
  }
})

test("the brutalist geometry applies to the default variant", async ({ page }) => {
  const first = page.locator("sk-empty-state").first()
  const computed = await first.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      width: cs.borderTopWidth,
      style: cs.borderTopStyle,
      radius: cs.borderRadius,
      shadow: cs.boxShadow,
    }
  })

  // Hard edges: chrome, not a floating layer.
  expect(computed.width).toBe("3px")
  expect(computed.style).toBe("solid")
  expect(computed.radius).toBe("0px")
  // A zero-blur offset shadow, which is the brutalist signature.
  expect(computed.shadow).not.toBe("none")
  expect(computed.shadow).toMatch(/0px 0px( 0px)?(,|$)/)
})

test("bare drops fill, stroke and shadow", async ({ page }) => {
  // The default surface has a real fill; the bare variant must be fully
  // unmaterialized — transparent fill, transparent stroke, no shadow.
  const styles = await page.evaluate(() =>
    ["sk-empty-state", 'sk-empty-state[variant="bare"]'].map((selector) => {
      const cs = getComputedStyle(document.querySelector(selector)!)
      return {
        background: cs.backgroundColor,
        border: cs.borderTopColor,
        shadow: cs.boxShadow,
      }
    }),
  )

  expect(styles[0].background).not.toBe("rgba(0, 0, 0, 0)")
  expect(styles[1].background).toBe("rgba(0, 0, 0, 0)")
  expect(styles[1].border).toBe("rgba(0, 0, 0, 0)")
  expect(styles[1].shadow).toBe("none")
})

test("heading and description render at their hooks", async ({ page }) => {
  const first = page.locator("sk-empty-state").first()
  await expect(first.locator('[data-slot="heading"]')).toHaveText("No deploys yet")
  await expect(first.locator('[data-slot="description"]')).toHaveText(
    "Push to main and the first build starts on its own.",
  )

  // The content is plain text in spans, and the component must not have
  // invented a heading element for it.
  const headingTags = await first
    .locator('[data-slot="heading"]')
    .evaluateAll((els) => els.map((el) => el.tagName.toLowerCase()))
  for (const tag of headingTags) {
    expect(tag.startsWith("h")).not.toBe(true)
  }
})

test("the actions row projects the slotted button, and the empty row is removed", async ({
  page,
}) => {
  const first = page.locator("sk-empty-state").first()
  // The consumer's sk-button must be projected, not shadowed.
  await expect(first.locator("sk-button[slot='actions']")).toHaveCount(1)

  const bare = page.locator('sk-empty-state[variant="bare"]').first()
  // The wrapper always exists; an unfilled one goes away by CSS (`:empty
  // { display: none }`), because scoped rendering hides the slot's emptiness.
  const actions = bare.locator('[data-slot="actions"]')
  await expect(actions).toHaveCount(1)
  expect(await actions.evaluate((el) => getComputedStyle(el).display)).toBe("none")
})

test("it carries no role, takes no focus, and stays silent in the accessibility tree", async ({
  page,
}) => {
  const first = page.locator("sk-empty-state").first()

  // A placeholder is a surface, not a control. A role or a tabindex would show
  // up in a screen reader's control list as a thing it never claimed to be.
  await expect(first).not.toHaveAttribute("role", /.+/)
  await expect(first).toHaveJSProperty("tabIndex", -1)

  // The actions row holds a real button, so the content is still reachable —
  // the surface itself is not a tab stop.
  await expect(first.locator("sk-button[slot='actions']")).toBeVisible()

  // A snapshot that contains a `region` or `group` role would prove the
  // component started announcing itself: neither the template nor the ARIA
  // spec gives it one, and this test guards against a future anchor-role
  // accident.
  const snapshot = await first.ariaSnapshot()
  expect(snapshot).not.toContain("region")
  expect(snapshot).not.toContain("group")
})

test("it follows the theme", async ({ page }) => {
  const before = await page
    .locator("sk-empty-state")
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopColor)
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-sk-theme", "dark")
  })
  const after = await page
    .locator("sk-empty-state")
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopColor)
  expect(after).not.toBe(before)
})
