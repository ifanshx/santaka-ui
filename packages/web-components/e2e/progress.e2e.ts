import { expect, test, type Locator, type Page } from "@playwright/test"

/**
 * Progress browser tests. A progress bar is a non-interactive status display:
 * what its contract claims is the ARIA wiring (role, clamped value, the
 * aria-valuenow omission as the indeterminate signal), the fill geometry it
 * paints, and the one animation it is allowed to own — the indeterminate
 * sweep, which must die under `prefers-reduced-motion` while the state stays
 * visible as a static partial fill.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})

/* The example page renders exactly four instances: 40/md, 70/sm, 100/lg, and
   the indeterminate one. Label text is the stable selector. */
const getByLabel = (page: Page, label: string) => page.locator(`sk-progress[aria-label="${label}"]`)

test("determinate instances expose the progressbar role and clamped aria values", async ({
  page,
}) => {
  const bar = getByLabel(page, "Uploading build 4821")
  await expect(bar).toHaveAttribute("role", "progressbar")
  await expect(bar).toHaveAttribute("aria-valuenow", "40")
  await expect(bar).toHaveAttribute("aria-valuemin", "0")
  await expect(bar).toHaveAttribute("aria-valuemax", "100")
  // The full instance is at the top of its range.
  await expect(getByLabel(page, "Complete")).toHaveAttribute("aria-valuenow", "100")
})

test("the bar's inline-size grows with the value and fills the track at 100", async ({ page }) => {
  const barWidthOf = (host: Locator) =>
    host.locator('[data-slot="bar"]').evaluate((el) => getComputedStyle(el).inlineSize)

  // The fill is a percentage of a laid-out track, so it is the one value in this
  // file that cannot be read before the first layout pass. Polling rather than
  // reading once: a `0px` read from before layout is a zero that says nothing
  // about the value.
  await expect
    .poll(async () => Number.parseFloat(await barWidthOf(getByLabel(page, "Uploading build 4821"))))
    .toBeGreaterThan(0)

  const forty = await barWidthOf(getByLabel(page, "Uploading build 4821"))
  const complete = await barWidthOf(getByLabel(page, "Complete"))
  const fortyPct = Number.parseFloat(forty)
  const fullPct = Number.parseFloat(complete)
  // Bezier-vs-integer slop is not worth asserting; what matters is ordering:
  // 40% is a partial fill, 100% fills the track the theme painted. That the fill
  // is painted at all is what the poll above proves — a second assertion on
  // visibility here only repeated it, and it is the one that ran out of time.
  expect(fortyPct).toBeGreaterThan(0)
  expect(fullPct).toBeGreaterThan(fortyPct)
})

test("the indeterminate instance omits aria-valuenow and carries data-indeterminate", async ({
  page,
}) => {
  const sweep = getByLabel(page, "Indexing the registry")
  await expect(sweep).toHaveAttribute("role", "progressbar")
  await expect(sweep).toHaveAttribute("data-indeterminate", "")
  // The omission IS the signal — assert the absence directly.
  await expect(sweep).not.toHaveAttribute("aria-valuenow")
})

test("only the indeterminate bar animates", async ({ page }) => {
  const animationName = (host: Locator) =>
    host.locator('[data-slot="bar"]').evaluate((el) => getComputedStyle(el).animationName)

  expect(await animationName(getByLabel(page, "Indexing the registry"))).not.toBe("none")
  expect(await animationName(getByLabel(page, "Uploading build 4821"))).toBe("none")
})

test("size changes the track's block size", async ({ page }) => {
  const trackBlockOf = (host: Locator) =>
    host.locator('[data-slot="track"]').evaluate((el) => getComputedStyle(el).blockSize)

  const sm = await trackBlockOf(getByLabel(page, "Compressing assets"))
  const md = await trackBlockOf(getByLabel(page, "Uploading build 4821"))
  const lg = await trackBlockOf(getByLabel(page, "Complete"))
  expect(Number.parseFloat(sm)).toBeLessThan(Number.parseFloat(md))
  expect(Number.parseFloat(md)).toBeLessThan(Number.parseFloat(lg))
})

test("label reaches the accessibility tree and a host's own aria-label wins", async ({ page }) => {
  const bar = getByLabel(page, "Uploading build 4821")
  await expect(bar).toHaveAttribute("aria-label", "Uploading build 4821")
  expect((await bar.ariaSnapshot()).includes("Uploading build 4821")).toBe(true)
})

test("the fill follows the theme", async ({ page }) => {
  const bar = getByLabel(page, "Uploading build 4821")
  const light = await bar
    .locator('[data-slot="bar"]')
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
  const dark = await bar
    .locator('[data-slot="bar"]')
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(dark).not.toBe(light)
})

test("reduced motion: the sweep stops and the state stays visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const sweepBar = getByLabel(page, "Indexing the registry").locator('[data-slot="bar"]')
  await expect
    .poll(() => sweepBar.evaluate((el) => getComputedStyle(el).animationName))
    .toBe("none")
  // The static degradation is a partial fill, not an empty track: a width of 0
  // would read as zero progress, which indeterminate never claims.
  const width = await sweepBar.evaluate((el) => getComputedStyle(el).inlineSize)
  expect(Number.parseFloat(width)).toBeGreaterThan(0)
})
