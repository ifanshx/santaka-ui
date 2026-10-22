import { expect, test } from "@playwright/test"

/**
 * Avatar browser tests.
 *
 * The claims this component makes are all accessibility claims, and none of
 * them is visible in a screenshot: the host must be the accessible image, the
 * inner `<img>` must be silent, and "no image" must be distinguishable from
 * "broken image" even though they paint identically.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test("the host is the accessible image, labelled with the person's name", async ({ page }) => {
  // The host carries `role="img"` and the name; the `<img>` inside is `alt=""`.
  // Putting the name on the `<img>` instead would leave the initials as a
  // second, competing text node inside the same box.
  const avatar = page.locator("#avatar-initials")
  await expect(avatar).toHaveAttribute("role", "img")
  await expect(avatar).toHaveAttribute("aria-label", "Ada Lovelace")
})

test("the initials are derived from the name and hidden from assistive tech", async ({ page }) => {
  // Two announcements of one person is not better than one: the host already
  // carries the name.
  const initials = page.locator('#avatar-initials [data-slot="initials"]')
  await expect(initials).toHaveText("AL")
  await expect(initials).toHaveAttribute("aria-hidden", "true")
})

test("a single-word name still yields one initial", async ({ page }) => {
  // The fallback is the first character, so a mononym is not an empty box.
  await page.evaluate(() => {
    const el = document.createElement("sk-avatar")
    el.id = "avatar-mononym"
    el.setAttribute("name", "Prince")
    document.body.append(el)
  })
  // Stencil renders asynchronously, so the element has no light-DOM children
  // until it has upgraded. Reading immediately would assert against an empty
  // host and pass on any initials logic, including none at all.
  const initials = page.locator('#avatar-mononym [data-slot="initials"]')
  await expect(initials).toHaveText("P")
})

test("an image that loads is announced by the host, not by the img", async ({ page }) => {
  const avatar = page.locator("#avatar-image")
  // The image is `loading="lazy"` — a deliberate choice, so an avatar below the
  // fold costs nothing until it is near it. The consequence for this test is
  // that the load does not start until the element is scrolled into view, so a
  // poll alone never turns `loading` into `loaded` on an engine that keeps it
  // off-screen. Scroll first, then wait.
  await avatar.scrollIntoViewIfNeeded()
  await expect(avatar).toHaveAttribute("data-state", "loaded", { timeout: 10_000 })
  await expect(avatar).toHaveAttribute("aria-label", "Grace Hopper")

  // `alt=""` on the inner image: the name lives on the host, and a second
  // announcement would be a duplicate rather than a fallback.
  const img = avatar.locator('[data-slot="image"]')
  await expect(img).toHaveAttribute("alt", "")
  await expect(img).toHaveAttribute("aria-hidden", "true")
})

test("a broken image falls back to initials and says so", async ({ page }) => {
  // `error` and `absent` paint the same pixels — this is the whole reason
  // `data-state` exists. A screenshot diff cannot tell a missing `src` from a
  // 404, and a reviewer looking at the page cannot either.
  const broken = page.locator("#avatar-broken")
  // `loading="lazy"` again: the request that produces `error` is not made until
  // the element is near the viewport, so scrolling is what starts the state
  // machine rather than an optimisation here.
  await broken.scrollIntoViewIfNeeded()
  await expect(broken).toHaveAttribute("data-state", "error", { timeout: 10_000 })
  await expect(broken.locator('[data-slot="initials"]')).toHaveText("AT")

  const absent = page.locator("#avatar-initials")
  await expect(absent).toHaveAttribute("data-state", "absent", { timeout: 10_000 })

  // Same pixels, different causes: both show initials, and the states differ.
  expect(await broken.getAttribute("data-state")).not.toBe(await absent.getAttribute("data-state"))
})

test("an avatar with no name and no image is hidden rather than mislabelled", async ({ page }) => {
  // The tempting fix for an unnamed image is a default label like "avatar",
  // which announces the designer's word instead of a person's name. Hiding is
  // the honest answer: there is no information to convey.
  const empty = page.locator("#avatar-empty")
  await expect(empty).toHaveAttribute("aria-hidden", "true")
  await expect(empty).not.toHaveAttribute("role", "img")
  // Still laid out as a box, so the row does not reflow.
  await expect(empty).toBeVisible()
})

test("size sets the diameter, and the frame stays square by ratio", async ({ page }) => {
  const box = async (selector: string) => {
    const bounds = await page.locator(selector).boundingBox()
    return { w: bounds?.width ?? 0, h: bounds?.height ?? 0 }
  }

  const sm = await box('sk-avatar[data-size="sm"]')
  const md = await box("#avatar-initials")
  const lg = await box('sk-avatar[data-size="lg"]')

  // Square: width and height agree, so `size` is genuinely one axis.
  expect(Math.abs(md.w - md.h)).toBeLessThanOrEqual(1)
  expect(sm.w).toBeLessThan(md.w)
  expect(md.w).toBeLessThan(lg.w)
})

test("the portrait is circular where chrome is square", async ({ page }) => {
  // A deliberate departure from ADR-017's zero radius: a portrait is not
  // chrome, and a square with no radius reads as a cropped document.
  const radius = await page
    .locator("#avatar-initials .sk-avatar__frame")
    .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
  expect(radius).toBe("9999px")
})
