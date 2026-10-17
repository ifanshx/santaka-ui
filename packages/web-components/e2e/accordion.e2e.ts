import { expect, test, type Locator, type Page } from "@playwright/test"

/**
 * Accordion browser tests.
 *
 * The base is the native `<details>`/`<summary>` pair, so the keyboard path
 * asserted here is the platform's: Enter and Space are pressed on a *focused*
 * summary and the reflected `open` attribute is expected to follow what the
 * browser did — never faked with a click.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const group = (page: Page, id: string) => page.locator(`#${id}`)
const item = (page: Page, id: string, index: number) =>
  group(page, id).locator("sk-accordion-item").nth(index)

const state = (locator: Locator) =>
  locator.evaluate((el) => ({
    // The host attribute is the reflected property the consumer reads.
    attribute: el.hasAttribute("open"),
    // The native node is the real state the browser owns.
    detailsOpen: (el.querySelector("details") as HTMLDetailsElement).open,
  }))

/**
 * `state`, asserted through a retry.
 *
 * Two asynchronous steps sit between a user gesture and this object: the
 * platform queues the `toggle` event as a task, and the component reflects the
 * property to the attribute on its next render. Reading `state` directly after
 * a click or a key press therefore catches the attribute one turn behind, which
 * was a flake in this test — about one run in ten — and not a defect in the
 * component. Every read after a gesture goes through here.
 */
const expectState = (locator: Locator, expected: { attribute: boolean; detailsOpen: boolean }) =>
  expect.poll(() => state(locator)).toEqual(expected)

test("each item renders a real details and summary", async ({ page }) => {
  const first = item(page, "accordion-basic", 0)
  await expect(first.locator("details")).toHaveCount(1)
  await expect(first.locator("details > summary")).toHaveCount(1)
  // No reimplemented button inside the summary: the native element supplies the
  // semantics and the activation, and a button in it would be a second control.
  await expect(first.locator("summary button")).toHaveCount(0)
  // The heading prop is a span, not a heading element — the item does not know
  // its level in the document outline.
  await expect(first.locator('[data-slot="heading"]')).toHaveText("What is Santaka UI?")
  await expect(first.locator("summary h1, summary h2, summary h3")).toHaveCount(0)
})

test("the item marked open in the markup starts expanded, reflected", async ({ page }) => {
  const open = await state(item(page, "accordion-basic", 0))
  const closed = await state(item(page, "accordion-basic", 1))
  expect(open).toEqual({ attribute: true, detailsOpen: true })
  expect(closed).toEqual({ attribute: false, detailsOpen: false })
})

test("Enter and Space on a focused summary toggle it, and the attribute follows", async ({
  page,
}) => {
  const second = item(page, "accordion-basic", 1)
  await second.locator("summary").focus()
  await expect(second).toHaveJSProperty("open", false)

  await page.keyboard.press("Enter")
  await expect(second).toHaveJSProperty("open", true)
  await expectState(second, { attribute: true, detailsOpen: true })

  await page.keyboard.press("Space")
  await expect(second).toHaveJSProperty("open", false)
  await expectState(second, { attribute: false, detailsOpen: false })
})

test("single-open closes siblings; multiple keeps them all", async ({ page }) => {
  const basic = item(page, "accordion-basic", 0)
  const many = item(page, "accordion-open-many", 1)

  // The platform dispatches `toggle` as a queued task, so the reflected state is
  // not readable in the same turn as the click. Reading it directly was this
  // test's flake — three runs in five — and it read as a component bug. The
  // reads below retry, and `state` (attribute plus native node) is polled, since
  // those two have to agree and neither is observable from a locator assertion.
  await item(page, "accordion-basic", 1).locator("summary").click()
  await expect(item(page, "accordion-basic", 1)).toHaveJSProperty("open", true)
  await expect(basic).toHaveJSProperty("open", false)
  await expectState(basic, { attribute: false, detailsOpen: false })

  // #accordion-open-many: `multiple` keeps them all. The second item starts
  // open, so the FIRST (closed) one is the one clicked — clicking an already
  // open summary would close it, which is the native behaviour, not the policy.
  await item(page, "accordion-open-many", 0).locator("summary").click()
  await expect(item(page, "accordion-open-many", 0)).toHaveJSProperty("open", true)
  await expect(many).toHaveJSProperty("open", true)
  await expectState(item(page, "accordion-open-many", 0), { attribute: true, detailsOpen: true })
})

test("a user toggle dispatches sk-open-change with detail.open, bubbling to the host", async ({
  page,
}) => {
  const events = await page.evaluate(
    () =>
      new Promise<
        Array<{
          target: string | null
          heading: string | null
          detail: { open: boolean } | undefined
        }>
      >((resolve) => {
        const host = document.querySelector("#accordion-basic")!
        const seen: Array<{
          target: string | null
          heading: string | null
          detail: { open: boolean } | undefined
        }> = []
        host.addEventListener("sk-open-change", (event) => {
          const custom = event as CustomEvent<{ open: boolean } | undefined>
          seen.push({
            target: (event.target as HTMLElement).tagName,
            // The heading, not only the tag: both items are `sk-accordion-item`,
            // so a tag alone cannot tell the item that opened from the sibling
            // the group closed.
            heading: (event.target as HTMLElement).getAttribute("heading"),
            detail: custom.detail,
          })
        })
        // The second item, which is closed in the markup. Clicking the first
        // would close it — it is authored `open` — and the event would then
        // report the close, not the open this test is about.
        const summary = document.querySelectorAll("#accordion-basic sk-accordion-item summary")[1]!
        summary.click()
        // Resolved on a later turn, after the bubbling has finished.
        setTimeout(() => resolve(seen), 50)
      }),
  )

  // Two events, and both are the contract: the clicked item opened, and the
  // group closed its sibling — the exclusion policy is observable through the
  // same stream a consumer listens to, not only through the final state.
  expect(events).toHaveLength(2)
  expect(events[0].target).toBe("SK-ACCORDION-ITEM")
  expect(events[0].heading).toBe("Does it need a framework?")
  expect(events[0].detail?.open).toBe(true)
  expect(events[1].heading).toBe("What is Santaka UI?")
  expect(events[1].detail?.open).toBe(false)
})

test("the drawn marker differs between open and closed, and is aria-hidden", async ({ page }) => {
  const first = item(page, "accordion-basic", 0)
  const second = item(page, "accordion-basic", 1)

  await expect(first.locator('[data-slot="marker"]')).toHaveAttribute("aria-hidden", "true")

  // The marker is two painted strokes on one element: `::before` is the
  // horizontal line and `::after` the vertical one, rotated. Their `content` is
  // empty in both states — reading it compares two empty strings and proves
  // nothing, which is what this assertion used to do. What changes is whether
  // the vertical stroke is drawn at all.
  const strokeDrawn = (locator: Locator) =>
    locator.evaluate((el) => getComputedStyle(el, "::after").display !== "none")

  const closedStroke = await strokeDrawn(second.locator('[data-slot="marker"]'))
  await second.locator("summary").click()
  await expect(second).toHaveJSProperty("open", true)
  const openStroke = await strokeDrawn(second.locator('[data-slot="marker"]'))
  const minusStillDrawn = await second
    .locator('[data-slot="marker"]')
    .evaluate((el) => getComputedStyle(el, "::before").display !== "none")

  // Plus to minus is the vertical stroke going, not a class appearing: the
  // closed marker draws both strokes, the open one draws only the horizontal,
  // and that stroke is still painted.
  expect(closedStroke).toBe(true)
  expect(openStroke).toBe(false)
  expect(minusStillDrawn).toBe(true)
})

test("the default container is brutalist chrome; plain is none of it", async ({ page }) => {
  const read = (id: string) =>
    group(page, id).evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        borderWidth: computed.borderTopWidth,
        borderStyle: computed.borderTopStyle,
        radius: computed.borderTopLeftRadius,
        boxShadow: computed.boxShadow,
      }
    })

  const def = await read("accordion-basic")
  expect(def.borderWidth).toBe("3px")
  expect(def.borderStyle).toBe("solid")
  expect(def.radius).toBe("0px")
  expect(def.boxShadow).not.toBe("none")
  // The harsh-offset signature: two equal offsets, no blur, no spread. The
  // colour is deliberately not asserted — the token paints `oklch()`, and a
  // regex over the colour syntax would fail the day the palette moved while the
  // geometry stayed exactly the same.
  const offsets = def.boxShadow.match(/(-?\d+(?:\.\d+)?)px (-?\d+(?:\.\d+)?)px 0px 0px$/)
  expect(offsets, `a zero-blur offset shadow, got "${def.boxShadow}"`).not.toBe(null)
  expect(offsets?.[1]).toBe(offsets?.[2])

  const plain = await read("accordion-open-many")
  expect(plain.borderWidth).toBe("0px")
  expect(plain.boxShadow).toBe("none")

  // The first item in the stroked container draws NO top rule — it would double
  // the container's own top edge. Its sibling does draw one, which is what
  // proves the selector is doing the work and the assertion is not trivially
  // true of every item.
  const firstItemRule = await item(page, "accordion-basic", 0).evaluate(
    (el) => getComputedStyle(el).borderBlockStartWidth,
  )
  const secondItemRule = await item(page, "accordion-basic", 1).evaluate(
    (el) => getComputedStyle(el).borderBlockStartWidth,
  )
  expect(firstItemRule).toBe("0px")
  expect(secondItemRule).not.toBe("0px")
})

test("under reduced motion the content wrapper has no animation and no transform", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/examples/vanilla-html/index.html")
  // The second item: the first is authored `open`, so clicking it would close
  // the panel this test then measures the entrance of.
  await item(page, "accordion-basic", 1).locator("summary").click()
  await expect(item(page, "accordion-basic", 1)).toHaveJSProperty("open", true)

  const motion = await item(page, "accordion-basic", 1)
    .locator('[data-slot="content"]')
    .evaluate((el) => {
      const computed = getComputedStyle(el)
      return { animationName: computed.animationName, transform: computed.transform }
    })

  expect(motion.animationName).toBe("none")
  // None of it — a 1ms slide is still a slide.
  expect(motion.transform).toBe("none")
})

test("it follows the theme", async ({ page }) => {
  const first = group(page, "accordion-basic")
  const read = () => first.evaluate((el) => getComputedStyle(el).backgroundColor)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()

  // Filled surfaces must move between themes; a switch that leaves the container
  // untouched means the token path is broken, not that the values coincide.
  expect(light).not.toBe("rgba(0, 0, 0, 0)")
  expect(dark).not.toBe(light)
})
