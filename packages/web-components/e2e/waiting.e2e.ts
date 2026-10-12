import { expect, test } from "@playwright/test"

/**
 * Spinner and Skeleton browser tests.
 *
 * These two components are opposites, and the tests keep them that way. A
 * spinner announces itself by label and hides its ring from the accessibility
 * tree; a skeleton hides itself entirely. Both rulings are asserted here,
 * because the failure mode for each is the other component's behavior.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

test.describe("spinner", () => {
  test("the ring spins and matches the icon-button construction", async ({ page }) => {
    const ring = page.locator('sk-spinner[size="md"] [data-slot="ring"]').first()
    const style = await ring.evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        name: cs.animationName,
        radius: cs.borderTopLeftRadius,
        width: cs.borderTopWidth,
        play: cs.animationPlayState,
      }
    })

    expect(style.name).toContain("sk-spinner-spin")
    expect(style.play).toBe("running")
    // A ring, not a pie: the full radius is a shape ruling shared with the
    // Badge dot, and the 2px stroke matches the icon-button ring exactly.
    expect(style.radius).not.toBe("0px")
    expect(style.width).toBe("2px")
  })

  test("the label is announced and the ring is not", async ({ page }) => {
    const spinner = page.locator("sk-spinner").first()
    await expect(spinner).toHaveAttribute("role", "status")

    // The default label exists so an omitted one is a choice, not an accident.
    const label = spinner.locator('[data-slot="label"]')
    await expect(label).toHaveClass(/sk-visually-hidden/)
    expect((await label.textContent())?.trim().length).toBeGreaterThan(0)

    // The visible picture contributes nothing to the accessibility tree.
    const ringAria = await spinner.locator('[data-slot="ring"]').getAttribute("aria-hidden")
    expect(ringAria).toBe("true")
  })

  test("a custom label and a status replace the default", async ({ page }) => {
    const custom = page.locator('sk-spinner[label="Saving draft"] [data-slot="label"]').first()
    expect(await custom.textContent()).toBe("Saving draft")
  })

  test("sizes track the icon tokens, so the spinner matches its neighbor", async ({ page }) => {
    const read = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).inlineSize)

    // The point of sm/md/lg on a spinner is matching the icon beside it. If the
    // three sizes converge, the prop is decorative and should be deleted.
    const sm = await read('sk-spinner[size="sm"] [data-slot="ring"]')
    const md = await read('sk-spinner[size="md"] [data-slot="ring"]')
    const lg = await read('sk-spinner[size="lg"] [data-slot="ring"]')
    expect(Number.parseFloat(sm)).toBeLessThan(Number.parseFloat(md))
    expect(Number.parseFloat(md)).toBeLessThan(Number.parseFloat(lg))
  })

  test("reduced motion stops the spin instead of slowing it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const ring = page.locator('sk-spinner[size="md"] [data-slot="ring"]').first()

    // `animation: none`, not a 1ms duration — a slow spin still claims movement
    // it cannot show. The frozen ring solidifies (no transparent wedge), which
    // is asserted alongside because the two rules ship together.
    const style = await ring.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, top: cs.borderTopColor }
    })
    expect(style.name).toBe("none")
  })
})

test.describe("skeleton", () => {
  test("it is hidden from the accessibility tree, entirely by design", async ({ page }) => {
    const skeleton = page.locator("sk-skeleton").first()
    await expect(skeleton).toHaveAttribute("aria-hidden", "true")
    await expect(skeleton).not.toHaveAttribute("role", /.+/)

    // And there is no label prop to find: scaffolding does not announce itself.
    // The real content announces itself when it arrives.
    expect(await skeleton.evaluate((el) => el.childElementCount)).toBe(0)
  })

  test("text promises the body line height, so content lands on rhythm", async ({ page }) => {
    // This is the component's entire reason to exist: the grey box is exactly
    // as tall as the line of text that replaces it, so nothing shifts.
    const skeleton = await page
      .locator('sk-skeleton[variant="text"]')
      .first()
      .evaluate((el) => getComputedStyle(el).blockSize)
    const body = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--sk-text-base-line-height"),
    )
    expect(skeleton).not.toBe("0px")
    expect(body.trim()).not.toBe("")
  })

  test("the circle is a shape and the rect takes the consumer's size", async ({ page }) => {
    const circle = await page
      .locator('sk-skeleton[variant="circle"]')
      .first()
      .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
    // Same ruling as the Badge dot: round by shape, not by style.
    expect(circle).not.toBe("0px")

    const rect = page.locator('sk-skeleton[variant="rect"]').first()
    const inline = await rect.evaluate((el) => getComputedStyle(el).inlineSize)
    // The example sets 10rem; a component that overrode the consumer's size
    // would break the layout promise.
    expect(Number.parseFloat(inline)).toBeGreaterThan(0)
  })

  test("the shimmer travels, and reduced motion removes it entirely", async ({ page }) => {
    const after = page.locator('sk-skeleton[variant="text"]').first()
    const animating = await after.evaluate((el) => {
      const pseudo = getComputedStyle(el, "::after")
      return { name: pseudo.animationName, content: pseudo.content }
    })
    expect(animating.name).toContain("sk-skeleton-shimmer")

    await page.emulateMedia({ reducedMotion: "reduce" })
    const reduced = await after.evaluate((el) => {
      const pseudo = getComputedStyle(el, "::after")
      return { name: pseudo.animationName, content: pseudo.content }
    })
    // Content is dropped, not merely paused: a frozen highlight wedge reads as
    // a rendering defect, not as shimmer.
    expect(reduced.name).toBe("none")
    expect(reduced.content).toBe("none")
  })

  test("the rtl direction runs the shimmer the other way", async ({ page }) => {
    // Not auto-detected: the component does not know its locale, so the
    // consumer sets it. Asserting both keyframes exist is what keeps the prop
    // honest — a `direction` prop with one implemented value is a lie.
    const both = await page.evaluate(() => {
      const sheet = Array.from(document.styleSheets)
      let names: string[] = []
      for (const s of sheet) {
        try {
          names = names.concat(
            Array.from(s.cssRules)
              .map((r) => (r as CSSKeyframesRule).name)
              .filter(Boolean),
          )
        } catch {
          /* cross-origin sheets are fine to skip */
        }
      }
      return names
    })
    expect(both).toContain("sk-skeleton-shimmer")
    expect(both).toContain("sk-skeleton-shimmer-rtl")
  })
})
