import { test, type Page } from "@playwright/test"
import { expectNoAxeViolations } from "./a11y"

/**
 * Whole-page axe scans over the three block example pages (ADR-022).
 *
 * A block is the composition layer — the markup a consumer actually ships —
 * so it is scanned where it renders: the example page under
 * `examples/vanilla-html/blocks/`, which loads the block source from
 * `packages/web-components/src/blocks/<name>/` rather than duplicating it.
 * A violation here can be a block-level wiring decision (a missing heading
 * level, an unlabeled control) as much as a component bug, so the label names
 * the page and the reported selectors narrow it from there.
 *
 * Each block page is scanned at rest in both themes. The dark pass exists so a
 * token-only contrast regression shows up the same way the component suite
 * catches it — the dark palette re-evaluates every color pair on the page.
 *
 * The wait problem is the one `a11y.e2e.ts` documents in full: a half-upgraded
 * page reports violations the settled page does not have, because an inert
 * custom element renders neither its slot wiring nor its label. Every custom
 * element must be hydrated and every finite animation settled before the
 * scan runs.
 *
 * One more state this page reaches that the component example does not: the
 * block markup arrives by fetch and is injected after the library has already
 * loaded (see `examples/vanilla-html/blocks/main.js`), so the page briefly
 * carries only the injection slot. Waiting for hydration *and* non-empty
 * block content together is the only order-safe read — animating or hydrating
 * at the moment of injection is exactly the state a scan should never see.
 */
async function waitForBlockReady(page: Page) {
  // Same budget as `a11y.e2e.ts` and for the same reason: this page hydrates a
  // whole composition, and the scan runs beside the other browser suites under
  // `turbo run test`. A scan that reports a half-upgraded page is a false
  // failure, so the wait is allowed to take longer than the default 30 s.
  await page.waitForFunction(
    () => {
      // Registered custom elements only: `slot-fb` is Stencil's slot fallback,
      // a hyphenated tag that is never defined and never hydrates — requiring it
      // hung this wait in the component suite until the test timed out.
      const custom = Array.from(document.querySelectorAll<HTMLElement>("*")).filter((el) => {
        const tag = el.tagName.toLowerCase()
        return tag.includes("-") && customElements.get(tag) !== undefined
      })
      const hydrated = custom.length > 0 && custom.every((el) => el.classList.contains("hydrated"))
      const injected = document.querySelector("[data-block]")?.children.length > 0
      const animations = document
        .getAnimations()
        .filter((animation) => {
          const timing = (animation.effect as KeyframeEffect | null)?.getTiming()
          return timing?.iterations !== Infinity
        })
        .every((animation) => animation.playState !== "running")
      return hydrated && injected && animations
    },
    undefined,
    { timeout: 60_000 },
  )
}

const BLOCK_PAGES = [
  { name: "dashboard", path: "/examples/vanilla-html/blocks/dashboard.html" },
  { name: "settings", path: "/examples/vanilla-html/blocks/settings.html" },
  { name: "authentication", path: "/examples/vanilla-html/blocks/authentication.html" },
] as const

for (const block of BLOCK_PAGES) {
  test(`${block.name} block passes axe in the light theme`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto(block.path)
    await waitForBlockReady(page)
    await expectNoAxeViolations(page, `${block.name} block, light theme`)
  })

  test(`${block.name} block passes axe in the dark theme`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto(block.path)
    await waitForBlockReady(page)
    // The theme switch is the documented mechanism (`data-sk-theme` on
    // <html>); the wait lets the transition land before the scan reads.
    await page.evaluate(() => document.documentElement.setAttribute("data-sk-theme", "dark"))
    await page.waitForTimeout(300)
    await expectNoAxeViolations(page, `${block.name} block, dark theme`)
  })
}
