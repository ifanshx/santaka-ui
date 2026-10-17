import { expect, test, type Page } from "@playwright/test"

/**
 * Responsive-state audit (plan.md §15: "accessibility, theme contrast, reduced
 * motion, and responsive states").
 *
 * There are no layout breakpoints in the component CSS — `@media` appears only
 * for `forced-colors` and `prefers-reduced-motion`. The components are fluid by
 * construction: logical properties, `inline-size: 100%`, flex. That is a
 * deliberate design, and this file is what turns it from a sentence into a
 * checked claim. "Fluid" has to mean something specific at a narrow viewport:
 *
 *   - the page does not scroll sideways,
 *   - a section given less width than its content honours it,
 *   - a component squeezed into a narrow wrapper does not overflow it,
 *   - the touch target still clears `--sk-touch-min`,
 *   - and the same holds in RTL, where the mirroring is not an afterthought.
 *
 * The widths are the narrow end of the phones the Core tier names, not a device
 * census: 320 is the floor the layout has to survive.
 */

const WIDTHS = [320, 360, 768] as const

/** Registered custom elements only — see the note in `a11y.e2e.ts`. */
const hydrationSettled = () =>
  Array.from(document.querySelectorAll<HTMLElement>("*"))
    .filter((el) => {
      const tag = el.tagName.toLowerCase()
      return tag.includes("-") && customElements.get(tag) !== undefined
    })
    .every((el) => el.classList.contains("hydrated"))

test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
  await page.waitForFunction(hydrationSettled)
})

/**
 * The horizontal overflow of the document itself, in pixels.
 *
 * `scrollWidth` against `clientWidth` rather than a per-element scan: it is the
 * measurement that matches what a user sees, it catches the overflow whoever
 * caused it, and it does not have to guess which elements are allowed to be
 * wider than the viewport (a table's own scroll region is).
 */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth - root.clientWidth
  })

test.describe("narrow viewports", () => {
  for (const width of WIDTHS) {
    test(`at ${width}px the page does not scroll sideways`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 })
      await expect.poll(() => overflow(page)).toBeLessThanOrEqual(1)
    })
  }

  test("a section narrows to the width it is given, content and all", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })

    const measured = await page.evaluate(() => {
      // A real section of the example page, squeezed. 240px is narrower than
      // every one of them was designed against.
      const section = document.querySelector("section") as HTMLElement
      const before = section.getBoundingClientRect().width
      const overflowBefore = section.scrollWidth - section.clientWidth
      section.style.width = "240px"
      const after = section.getBoundingClientRect().width
      const overflowAfter = section.scrollWidth - section.clientWidth
      section.style.width = ""
      return { before, overflowBefore, after, overflowAfter }
    })

    // It was wider than 240 before, so the assertion is about narrowing rather
    // than about a section that was already narrow.
    expect(measured.before).toBeGreaterThan(240)
    expect(measured.after).toBeLessThanOrEqual(241)
    // The fixture is clean before the squeeze, so the measurement after it means
    // something.
    expect(measured.overflowBefore).toBeLessThanOrEqual(1)
    // Nothing inside pushed the section wider. The section's own scrollWidth,
    // not the widest descendant: a table is allowed to scroll its own overflow,
    // and a descendant scan cannot tell that from a component that refuses to
    // shrink.
    expect(measured.overflowAfter).toBeLessThanOrEqual(1)
  })

  test("a component put in a narrow wrapper overflows neither the wrapper nor the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 })

    const measured = await page.evaluate(async () => {
      const wrapper = document.createElement("div")
      wrapper.style.width = "200px"
      document.body.appendChild(wrapper)

      const results: Array<{ tag: string; width: number; overflow: number; upgraded: boolean }> = []
      for (const tag of ["sk-input", "sk-card", "sk-table", "sk-button"]) {
        // Created rather than borrowed from the example page: every `sk-card`
        // there carries an authored `min-inline-size`, and a consumer's own
        // minimum is a consumer's decision. What is under test is the component
        // with no authored minimum at all.
        const el = document.createElement(tag)
        wrapper.appendChild(el)
        // The element upgrades when it connects, but its shadow template and
        // therefore its box need a frame to settle.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        results.push({
          tag,
          width: el.getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          upgraded: customElements.get(tag) !== undefined && el.classList.contains("hydrated"),
        })
        el.remove()
      }
      wrapper.remove()
      return results
    })

    for (const row of measured) {
      // A measurement of an unupgraded element would be a measurement of
      // nothing, so say so rather than reporting its zero.
      expect(row.upgraded, `${row.tag} was not upgraded`).toBe(true)
      // The wrapper is 200. A component that keeps a designed minimum shows up
      // here as a width above it.
      expect(row.width, `${row.tag} in a 200px wrapper`).toBeLessThanOrEqual(201)
      // And it must not have pushed the page sideways on its way out.
      expect(row.overflow, `${row.tag} overflow at 320px`).toBeLessThanOrEqual(1)
    }

    // The block-level ones fill what they are given rather than sitting at a
    // fixed width; `sk-button` sizes to its label, so only the ceiling applies.
    for (const row of measured.filter((row) => row.tag !== "sk-button")) {
      expect(row.width, `${row.tag} does not fill the wrapper`).toBeGreaterThanOrEqual(199)
    }
  })

  test("the touch target still clears the token at the narrowest width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })

    const authored = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--sk-touch-min").trim(),
    )
    expect(authored, "--sk-touch-min is not declared").not.toBe("")

    const minimum = await page.evaluate((raw) => {
      const probe = document.createElement("div")
      probe.style.position = "absolute"
      probe.style.visibility = "hidden"
      probe.style.width = raw
      document.body.appendChild(probe)
      const width = probe.getBoundingClientRect().width
      probe.remove()
      return width
    }, authored)
    expect(minimum).toBeGreaterThan(0)

    // The host is the button: `sk-button` carries `role="button"` itself and
    // renders no inner `<button>`, so the host's box is the activation target.
    // `touch-target.e2e.ts` measures the same element for the same reason.
    const button = page.locator("sk-button").first()
    await expect(button).toHaveCount(1, { timeout: 10_000 })
    const measured = await button.evaluate((el) => {
      const box = el.getBoundingClientRect()
      return { height: box.height, right: box.right, viewport: window.innerWidth }
    })

    expect(measured.height).toBeGreaterThanOrEqual(minimum - 0.5)
    // Squeezed is fine; pushed off the edge is not.
    expect(measured.right).toBeLessThanOrEqual(measured.viewport + 1)
  })
})

test.describe("right-to-left at a narrow width", () => {
  test("the page still does not scroll sideways, and the marker mirrors", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })

    const measured = await page.evaluate(() => {
      const marker = () =>
        (
          document
            .querySelector("#accordion-basic sk-accordion-item summary")!
            .querySelector('[data-slot="marker"]') as HTMLElement
        ).getBoundingClientRect()
      const summary = document
        .querySelector("#accordion-basic sk-accordion-item summary")!
        .getBoundingClientRect()

      document.documentElement.dir = "ltr"
      const ltr = { marker: marker(), summary }
      document.documentElement.dir = "rtl"
      const rtl = { marker: marker(), summary }
      document.documentElement.dir = ""

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // Distance from the summary's own inline start, which is the left edge
        // in LTR and the right edge in RTL: the marker should be the same
        // distance from it in both, which is what "mirrored" means.
        ltr: ltr.marker.left - ltr.summary.left,
        rtl: rtl.summary.right - rtl.marker.right,
      }
    })

    expect(measured.overflow).toBeLessThanOrEqual(1)
    expect(Math.abs(measured.ltr - measured.rtl)).toBeLessThanOrEqual(1)
  })
})
