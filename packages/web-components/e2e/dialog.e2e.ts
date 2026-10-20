import { expect, test } from "@playwright/test"

/**
 * Dialog browser tests.
 *
 * The dialog's entire contract is behavior: focus in, focus trapped, focus
 * out, Escape, backdrop, and its announcement. None of it can be asserted from
 * source, which is exactly why the native <dialog> element is the dependency —
 * these tests prove the browser is doing the work and the component is only
 * wiring state.
 *
 * A note on shape: every query inside `evaluate` re-derives its element from
 * `document`, because module-scope locator strings do not exist in page
 * context — an earlier draft referenced them and failed on the missing
 * variable rather than on any behavior.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
  await page.locator('sk-dialog sk-button[slot="trigger"]').click()
  await expect(page.locator('sk-dialog dialog[data-slot="panel"]')).toBeVisible()
})

const PANEL = 'sk-dialog dialog[data-slot="panel"]'

test("the trigger opens the dialog and focus lands inside", async ({ page }) => {
  await expect(page.locator("sk-dialog")).toHaveAttribute("data-state", "open")

  const inside = await page.evaluate(() => {
    const dialog = document.querySelector("sk-dialog dialog")
    return dialog ? dialog.contains(document.activeElement) : false
  })
  // Initial focus must be inside the panel, or a keyboard user is nowhere.
  expect(inside).toBe(true)
})

test("focus is trapped while open", async ({ page }) => {
  // Walk several tabs. The native dialog makes the page behind inert, so every
  // stop stays inside — the behavioral proof, not a tabIndex detail the
  // platform owns.
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")

  const stillInside = await page.evaluate(() => {
    const dialog = document.querySelector("sk-dialog dialog")
    return dialog ? dialog.contains(document.activeElement) : false
  })
  expect(stillInside).toBe(true)
})

test("escape closes it, and focus returns to the trigger", async ({ page }) => {
  await page.keyboard.press("Escape")
  await expect(page.locator(PANEL)).not.toBeVisible()
  await expect(page.locator("sk-dialog")).toHaveAttribute("data-state", "closed")

  // Focus returning to the invoker is the whole point: without it, a keyboard
  // user is dropped at the top of the document after every dialog.
  await expect(page.locator('sk-dialog sk-button[slot="trigger"]')).toBeFocused()
})

test("the backdrop click dismisses a dismissible dialog", async ({ page }) => {
  // A click on the <dialog> element itself is a click on the backdrop area.
  await page.locator(PANEL).click({ position: { x: 4, y: 4 } })
  await expect(page.locator(PANEL)).not.toBeVisible()
})

test("a click inside the panel does not dismiss it", async ({ page }) => {
  // The panel's content is text; clicking it must not close the dialog. This
  // is the dismissal rule's other half, and it is what separates a backdrop
  // click from a mis-aimed one.
  await page.locator('sk-dialog [slot="title"]').click()
  await expect(page.locator(PANEL)).toBeVisible()
})

test("the action buttons close the dialog", async ({ page }) => {
  await page.locator("#dialog-cancel").click()
  await expect(page.locator(PANEL)).not.toBeVisible()
  await expect(page.locator("#dialog-result")).toHaveText("kept editing")
})

test("the confirm path records the outcome", async ({ page }) => {
  // The dialog is already open from beforeEach; going through the trigger
  // again would toggle it shut. Click confirm directly.
  await page.locator("#dialog-confirm").click()
  await expect(page.locator(PANEL)).not.toBeVisible()
  await expect(page.locator("#dialog-result")).toHaveText("draft discarded")
})

test("the slotted title is a real heading in the tree", async ({ page }) => {
  // The dialog is labelled by its heading being real content, visible to
  // everyone — a component that generated a hidden label would be two sources
  // of one truth.
  const heading = page.locator('sk-dialog [slot="title"] h3')
  await expect(heading).toHaveText("Discard draft?")
})

test("the panel wears the glass material, not the chrome stroke", async ({ page }) => {
  const style = await page.locator(PANEL).evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      radius: cs.borderTopLeftRadius,
      blur: cs.backdropFilter,
      border: cs.borderTopWidth,
      shadow: cs.boxShadow,
    }
  })

  // Glass rounds; chrome does not. If the panel were hard-edged, the two
  // materials would have collapsed into one.
  expect(style.radius).not.toBe("0px")
  expect(style.blur).toContain("blur(")
  // Glass is a 1px material line, not the 3px chrome stroke.
  expect(style.border).toBe("1px")
  expect(style.shadow).not.toBe("none")
})

test("the backdrop is a scrim, and the panel sits above it", async ({ page }) => {
  const layers = await page.evaluate(() => {
    const dialog = document.querySelector("sk-dialog dialog")
    if (!dialog) return null
    const cs = getComputedStyle(dialog, "::backdrop")
    return { backdrop: cs.backgroundColor, z: getComputedStyle(dialog).zIndex }
  })
  expect(layers).not.toBeNull()
  expect(layers!.backdrop).not.toBe("rgba(0, 0, 0, 0)")
  expect(Number.parseInt(layers!.z, 10)).toBeGreaterThanOrEqual(1000)
})

test("sk-open-change reports both directions", async ({ page }) => {
  // The dialog is open from beforeEach. Escape closes it; the promise resolves
  // on the first event rather than waiting for a second open, because the
  // close->open round trip through the native cancel event is already covered
  // by the escape test's focus assertions.
  const first = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const host = document.querySelector("sk-dialog")!
        host.addEventListener("sk-open-change", (e) => resolve((e as CustomEvent).detail.open), {
          once: true,
        })
        const dialog = document.querySelector("sk-dialog dialog")!
        dialog.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }))
      }),
  )
  expect(first).toBe(false)

  // And opening again reports true — through the same prop, not a second path.
  const second = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const host = document.querySelector("sk-dialog")!
        host.addEventListener("sk-open-change", (e) => resolve((e as CustomEvent).detail.open), {
          once: true,
        })
        ;(host.querySelector("sk-button[slot='trigger']") as HTMLElement).click()
      }),
  )
  expect(second).toBe(true)
})

test("reduced motion removes the entrance animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const animation = await page.locator(PANEL).evaluate((el) => getComputedStyle(el).animationName)
  // glass.css's ruling: a 1ms entrance is still an entrance.
  expect(animation).toBe("none")
})

test("the trigger carries its state before the first open", async ({ page }) => {
  // `initTriggerState` exists for one reason: `aria-expanded="false"` must be on
  // the invoker from first paint, not appear the first time the panel opens. An
  // invoker that silently gains a state mid-session is announced differently
  // before and after its first use.
  //
  // This loads a dialog that has never been opened, so showDialog has not run
  // and the only way the attribute exists is the upgrade-time write.
  await page.goto("/examples/vanilla-html/index.html")
  const before = page.locator("sk-dialog [slot='trigger']")
  await expect(before).toHaveAttribute("aria-haspopup", "dialog")
  await expect(before).toHaveAttribute("aria-expanded", "false")

  // And it tracks the open state once it is used, the same way the popover's
  // does — one set of mechanics in shared/dialog-base.ts, one contract.
  await before.click()
  await expect(before).toHaveAttribute("aria-expanded", "true")
})
