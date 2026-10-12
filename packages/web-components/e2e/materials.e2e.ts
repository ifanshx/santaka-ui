import { expect, test, type Locator } from "@playwright/test"

/**
 * The neo-brutalist and glass system, asserted against real Chromium.
 *
 * Section 9 of plan.md is the source of these checks. What they share is that
 * each one fails if a token reference silently falls back to its inline literal
 * — which is the failure mode a re-skin actually produces. A renamed token does
 * not throw; it quietly renders the fallback that was written to cover the case
 * where the token is missing, and the component looks merely slightly wrong.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/**
 * Chrome components that are raised at rest, keyed by the variant to select.
 *
 * `ghost` is deliberately flat at rest — stroke only, no shadow — so it reads
 * as the quietest chrome. Selecting the first element in the DOM instead picked
 * up the ghost variant and reported a missing shadow on a component that had
 * one. The press tests below still cover ghost, because hover brings its
 * shadow in.
 */
const RAISED: Array<[string, string]> = [
  ["sk-button", 'sk-button[variant="primary"]'],
  ["sk-icon-button", 'sk-icon-button[variant="primary"]'],
  ["sk-card", 'sk-card[padding="md"]'],
]

test("every chrome component has a 3px solid stroke and no rounding", async ({ page }) => {
  for (const [tag, selector] of RAISED) {
    const style = await page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el)
        return {
          width: cs.borderTopWidth,
          style: cs.borderTopStyle,
          radius: cs.borderTopLeftRadius,
        }
      })
    expect(style.width, `${tag} border width`).toBe("3px")
    expect(style.style, `${tag} border style`).toBe("solid")
    expect(style.radius, `${tag} radius`).toBe("0px")
  }
})

test("every raised chrome component has a hard offset shadow with zero blur", async ({ page }) => {
  for (const [tag, selector] of RAISED) {
    const shadow = await page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow)

    expect(shadow, `${tag} shadow`).not.toBe("none")
    // A hard offset is `<color> Xpx Ypx 0px <spread>`. The blur radius is the
    // third length and must be zero — a nonzero blur means the re-skin left a
    // layered drop shadow behind, which is the soft language this replaced.
    const parts = /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/.exec(shadow)
    expect(parts, `${tag} shadow has an unexpected shape: ${shadow}`).not.toBeNull()
    expect(Number.parseFloat(parts![3]), `${tag} shadow blur`).toBe(0)

    // And the offset itself must be nonzero, or there is no brutalist direction
    // to it at all.
    expect(Number.parseFloat(parts![1]), `${tag} shadow x-offset`).not.toBe(0)
  }
})

test("a ghost control is flat at rest but still lifts on hover", async ({ page }) => {
  // Ghost trades the resting shadow for a quiet stroke. Dropping the hover
  // shadow as well would leave a control with no depth cue in either state,
  // which reads as unstyled rather than as deliberate.
  const ghost = page.locator('sk-icon-button[variant="ghost"]').first()
  expect(await ghost.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none")

  await ghost.hover()
  await expect
    .poll(async () => ghost.evaluate((el) => getComputedStyle(el).boxShadow))
    .not.toBe("none")
})

test("a badge is chrome, but its dot stays a circle", async ({ page }) => {
  // Both halves matter. A badge is a control you read, so it is hard-edged; a
  // status dot is a shape, so it keeps the full radius. Getting either wrong is
  // a visible regression, and each was true for a different reason.
  const pill = page.locator('sk-badge[data-variant="success"]').first()
  expect(await pill.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("0px")
  expect(await pill.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("3px")

  const dot = page.locator("sk-badge[data-dot]").first()
  expect(await dot.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).not.toBe("0px")
})

test("the focus ring is a hard 3px ring, not a soft glow", async ({ page }) => {
  const button = page.locator('sk-button[variant="primary"]').first()
  await button.focus()

  const ring = await button.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      width: Number.parseFloat(cs.outlineWidth),
      offset: Number.parseFloat(cs.outlineOffset),
      style: cs.outlineStyle,
    }
  })

  expect(ring.style).not.toBe("none")
  expect(ring.width).toBeGreaterThanOrEqual(3)
  expect(ring.offset).toBeGreaterThanOrEqual(3)
})

test("the press lifts on hover and drives down on active", async ({ page }) => {
  const button = page.locator('sk-button[variant="primary"]').first()
  const read = () =>
    button.evaluate((el) => ({
      shadow: getComputedStyle(el).boxShadow,
      translate: getComputedStyle(el).translate,
    }))

  const rest = await read()
  await button.hover()
  await expect.poll(async () => (await read()).shadow).not.toBe(rest.shadow)

  const hovered = await read()
  // The lift is half the 3px stroke, so the control stays registered to its
  // grid cell while the shadow moves. A lift of zero would mean the press reads
  // as a color change instead of a physical press.
  expect(hovered.translate).not.toBe(rest.translate)

  // `:active` needs a held button. The earlier version called `mouse.down()` on
  // the locator, which is not a Locator method at all — it failed on the missing
  // function rather than on the behavior it was trying to assert.
  await page.mouse.down()
  await expect.poll(async () => (await read()).shadow).not.toBe(hovered.shadow)
  await page.mouse.up()
})

test("a disabled button does not respond to the press", async ({ page }) => {
  // The lift is `:hover:not([data-disabled])`. If the guard were dropped, a
  // disabled control would animate as though it were live, which tells the user
  // the opposite of the truth.
  const button = page.locator("sk-button[data-disabled]").first()
  const shadow = await button.evaluate((el) => getComputedStyle(el).boxShadow)
  await button.hover({ force: true })
  await page.waitForTimeout(250)
  expect(await button.evaluate((el) => getComputedStyle(el).boxShadow)).toBe(shadow)
})

test("glass is a separate material from chrome, and both are visible", async ({ page }) => {
  const glass = page.locator(".sk-glass").first()
  const card = page.locator("sk-card").first()

  await expect(glass).toBeVisible()
  await expect(card).toBeVisible()

  const read = (locator: Locator) =>
    locator.evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        radius: cs.borderTopLeftRadius,
        blur: cs.backdropFilter || cs.webkitBackdropFilter,
      }
    })

  const glassStyle = await read(glass)
  const cardStyle = await read(card)

  // Glass rounds, chrome does not. This is the whole point of the two materials:
  // if glass were hard-edged too, it would read as another button.
  expect(glassStyle.radius).not.toBe("0px")
  expect(cardStyle.radius).toBe("0px")

  // And glass actually blurs its backdrop rather than being a translucent box.
  // The value serializes as `blur(24px) saturate(1.8)`, so the radius has to be
  // pulled out of the function — parsing the whole string as a number yields
  // NaN, which is what the first version of this assertion compared.
  expect(glassStyle.blur).toContain("blur(")
  const blurRadius = /blur\((\d+(?:\.\d+)?)px\)/.exec(glassStyle.blur)
  expect(blurRadius, `unparseable backdrop-filter: ${glassStyle.blur}`).not.toBeNull()
  expect(Number.parseFloat(blurRadius![1])).toBeGreaterThan(0)
})

test("glass is opaque enough to stay readable without a backdrop blur", async ({ page }) => {
  // Chromium supports backdrop-filter, so the supported path runs here. What is
  // asserted is the *material* underneath: even the blurred fill must not be so
  // transparent that text loses its contrast, because a Core-tier browser drops
  // the blur and keeps this same alpha. If the fallback were weaker than the
  // glass fill, degradation would make text unreadable rather than plainer.
  const background = await page
    .locator(".sk-glass")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)

  const alpha = /rgba?\([^)]*?,\s*([\d.]+)\s*\)/.exec(background)
  expect(alpha, `glass background is not rgba: ${background}`).not.toBeNull()
  expect(Number.parseFloat(alpha![1]), "glass fill alpha").toBeGreaterThanOrEqual(0.7)
})

test("both materials follow the theme", async ({ page }) => {
  const read = () =>
    page.evaluate(() => ({
      glass: getComputedStyle(document.querySelector(".sk-glass")!).backgroundColor,
      card: getComputedStyle(document.querySelector('sk-card[padding="md"]')!).backgroundColor,
    }))

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()

  // A theme switch that leaves a material untouched means its token path is
  // broken, not that the two themes happen to share a value.
  expect(dark.glass).not.toBe(light.glass)
  expect(dark.card).not.toBe(light.card)
})

test("reduced motion removes the press animation, not just its duration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const button = page.locator('sk-button[variant="primary"]').first()

  const style = await button.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { duration: cs.transitionDuration, property: cs.transitionProperty }
  })

  // Two things have to be true, and only the second is obvious. The duration
  // is flattened to a near-zero value (`1e-05s` is Chromium's serialization of
  // `0.01ms`), so matching on `0s` alone would fail against a correct build.
  // What matters is `transition-property: none` — without it a 1ms translate is
  // still a translate, and the press still animates.
  expect(style.property).toBe("none")
  expect(Number.parseFloat(style.duration)).toBeLessThan(0.001)
})

test("the display face and the heavy display steps exist", async ({ page }) => {
  // Section 5 added `--sk-font-display` and two 800-weight display steps. A
  // consumer replaces the whole stack with one line; if the token is missing,
  // that line does nothing and nothing warns.
  const font = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--sk-font-display").trim(),
  )
  expect(font).not.toBe("")

  const weight = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--sk-text-display-weight").trim(),
  )
  expect(Number.parseInt(weight, 10)).toBeGreaterThanOrEqual(800)
})
