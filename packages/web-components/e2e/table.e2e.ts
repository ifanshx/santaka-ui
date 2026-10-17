import { expect, test, type Locator, type Page } from "@playwright/test"

/**
 * Table browser tests. The component is a skin the consumer authors a real
 * `<table>` inside, so what it can claim is: the consumer's table semantics
 * survive untouched, the container paints the brutalist chrome (or doesn't,
 * for `plain`), and the documented props change what they say they change.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

const deployments = (page: Page) => page.locator('sk-table[label="Deployments"]')
const queue = (page: Page) => page.locator('sk-table[label="Queue"]')

test("the consumer's real table semantics survive", async ({ page }) => {
  const table = deployments(page).locator("table")

  // Read from the accessibility tree, because the a11y mapping is the contract,
  // not the DOM shape: a caption, one columnheader per header cell, one row per
  // row.
  await expect(table).toHaveAccessibleName("Deployments in the last 24 hours")
  await expect(deployments(page).locator("thead th[scope='col']")).toHaveCount(4)
  await expect(deployments(page).locator("tbody tr")).toHaveCount(3)

  // The component must not have wrapped the consumer's table in structure of its
  // own: no invented role on the host, no synthetic grid or table roles, and no
  // second table. What sits between the scroll region and the table is the
  // consumer's own tree — nothing was inserted to hold it.
  expect(await deployments(page).evaluate((el) => el.getAttribute("role"))).toBe(null)
  expect(await deployments(page).locator('[role="grid"], [role="row"]').count()).toBe(0)
  expect(await deployments(page).locator("table").count()).toBe(1)
  expect(await table.evaluate((el) => el.parentElement?.getAttribute("data-slot"))).toBe("viewport")
})

test("the caption is present and announced", async ({ page }) => {
  const caption = deployments(page).locator("table > caption")

  // A caption is the table's accessible name when present, so it is announced
  // with the table rather than as a stray aside. It also has to stay in the
  // layout: a caption the stylesheet collapsed away would still be named, so the
  // name check on its own proves nothing.
  await expect(caption).toHaveText("Deployments in the last 24 hours")
  await expect(caption).toBeVisible()
})

test("the default instance paints the brutalist chrome", async ({ page }) => {
  const style = await deployments(page)
    .locator('[data-slot="viewport"]')
    .evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        radius: computed.borderTopLeftRadius,
        width: computed.borderTopWidth,
        boxShadow: computed.boxShadow,
      }
    })

  // Hard edges: the container is chrome, not a floating layer.
  expect(style.radius).toBe("0px")
  expect(style.width).toBe("3px")
  // A zero-blur offset shadow, which is the brutalist signature.
  expect(style.boxShadow).not.toBe("none")
  expect(style.boxShadow).toMatch(/0px 0px/)
})

test("plain drops the fill and the shadow, and leaves the stroke unpainted", async ({ page }) => {
  const read = (host: Locator) =>
    host.locator('[data-slot="viewport"]').evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        width: computed.borderTopWidth,
        stroke: computed.borderTopColor,
        shadow: computed.boxShadow,
        transparent: computed.backgroundColor === "rgba(0, 0, 0, 0)",
      }
    })

  const plain = await read(queue(page))
  const decorated = await read(deployments(page))

  // `plain` is for a table inside a card: the fill and the shadow go, and the
  // stroke is painted transparent rather than removed — the repo's `bare` and
  // empty-state variants do the same. The width is what must not change, because
  // a variant swap that reflowed the table would move every row under the
  // pointer.
  expect(plain.transparent).toBe(true)
  expect(plain.shadow).toBe("none")
  expect(plain.stroke).toBe("rgba(0, 0, 0, 0)")
  expect(plain.width).toBe(decorated.width)
})

test("striped paints the even rows, and only the even rows", async ({ page }) => {
  const rows = queue(page).locator("tbody tr")
  const first = await rows.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor)
  const even = await rows.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor)

  // The zebra has to actually differ; a row compared to itself is not a test.
  expect(even).not.toBe(first)

  // And the unstriped table's rows all match each other.
  const plainRows = deployments(page).locator("tbody tr")
  const rowOne = await plainRows.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor)
  const rowTwo = await plainRows.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(rowTwo).toBe(rowOne)
})

test("compact reduces the cell padding the default density uses", async ({ page }) => {
  // The example ships one default table and one compact table; both paddings
  // come from the space scale, so this must be a real difference.
  const defaultPadding = await deployments(page)
    .locator("tbody td")
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingBlockStart))
  const compact = await queue(page)
    .locator("tbody td")
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingBlockStart))

  expect(defaultPadding).toBeGreaterThan(0)
  expect(compact).toBeLessThan(defaultPadding)
})

test("the viewport is keyboard-focusable and the label wires the group role", async ({ page }) => {
  // The scroll container is a tab stop: an overflow region keyboard users
  // cannot reach is content they cannot read (WCAG 2.1.1).
  const viewport = deployments(page).locator('[data-slot="viewport"]')
  await expect(viewport).toHaveJSProperty("tabIndex", 0)

  const labelled = queue(page).locator('[data-slot="viewport"]')
  await expect(labelled).toHaveAttribute("role", "group")
  await expect(labelled).toHaveAccessibleName("Queue")

  // And the tab stop actually works from the keyboard's perspective.
  await labelled.focus()
  await expect(labelled).toBeFocused()
})

test("an unlabelled table carries no role rather than an empty name", async ({ page }) => {
  // The example labels both of its tables, so the empty-name path is created
  // here: an sk-table with no `label` must leave role and aria-label off the
  // viewport entirely — a nameless group is noise in the accessibility tree.
  const attributes = await page.evaluate(
    () =>
      new Promise<{ role: string | null; label: string | null }>((resolve) => {
        const host = document.createElement("sk-table")
        host.innerHTML =
          "<table><thead><tr><th scope='col'>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>"
        document.body.append(host)

        const find = (attempt: number): void => {
          const viewport = [...host.children].find(
            (child) => child.getAttribute("data-slot") === "viewport",
          ) as HTMLElement | undefined
          if (viewport) {
            resolve({
              role: viewport.getAttribute("role"),
              label: viewport.getAttribute("aria-label"),
            })
            return
          }
          if (attempt > 100) {
            resolve({ role: "timeout", label: "timeout" })
            return
          }
          requestAnimationFrame(() => find(attempt + 1))
        }
        find(0)
      }),
  )

  expect(attributes.role).toBe(null)
  expect(attributes.label).toBe(null)
})

test("it follows the theme", async ({ page }) => {
  const viewport = deployments(page).locator('[data-slot="viewport"]')
  const read = () => viewport.evaluate((el) => getComputedStyle(el).backgroundColor)

  const light = await read()
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await read()

  // A theme switch that leaves the viewport untouched means the token path is
  // broken, not that the two themes happen to share a value.
  expect(dark).not.toBe(light)
})

test("header cells align start and carry a 3px block-end stroke", async ({ page }) => {
  const style = await deployments(page)
    .locator("thead th")
    .first()
    .evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        align: computed.textAlign,
        ruleWidth: computed.borderBlockEndWidth,
        ruleStyle: computed.borderBlockEndStyle,
      }
    })

  expect(style.align).toBe("start")
  expect(style.ruleWidth).toBe("3px")
  expect(style.ruleStyle).toBe("solid")
})
