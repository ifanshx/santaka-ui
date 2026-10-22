import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@santaka-ui/svelte"

/**
 * The Svelte example's browser suite: docs/ARCHITECTURE.md section 16's Svelte row —
 * "Props/events, SSR and hydration tests" — plus section 16's form gate, "every
 * form control submits through a plain `<form>`".
 *
 * Two claims need a real browser and neither can be made anywhere else:
 *
 *   - The server render is markup the browser can hydrate. `svelte/server` and
 *     `hydrate` cannot both be exercised by `svelte-check`; the difference
 *     between hydrating the server's DOM and replacing it is observable only in
 *     a document that actually loaded, which is what this file asserts.
 *   - A form-associated custom element participates in submission. jsdom has no
 *     FACE implementation and no constraint validation, so a unit test can only
 *     assert that `name` reached an attribute or property. Whether the browser
 *     then *submits* the control is a different claim.
 *
 * Every value below is read from the browser — the served bytes, its own DOM,
 * its own `FormData`, the `customElements` registry — never from component
 * state. That is what makes this evidence about the platform path rather than
 * about the example's bookkeeping.
 */

/**
 * The options the example passes, restated here rather than imported from
 * `App.svelte`: a test that read the example's own constant would agree with a
 * wrong constant. These are the values the page is expected to show.
 */
const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
]

const TIERS = [
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
]

/** The form as the browser submits it: entries in order, as string pairs. */
async function submitted(page: Page) {
  return page.evaluate(() => {
    const form = document.querySelector("form[data-testid='form']")
    if (form === null) return null
    return Array.from(new FormData(form as HTMLFormElement).entries()).map(
      ([name, value]) => [name, typeof value === "string" ? value : `<${value.name}>`] as const,
    )
  })
}

/** Wait for every custom element on the page to upgrade before asserting. */
async function waitForUpgrade(page: Page) {
  await page.waitForFunction(() => {
    const tags = [
      "sk-input",
      "sk-textarea",
      "sk-select",
      "sk-checkbox",
      "sk-switch",
      "sk-radio-group",
    ]
    return tags.every((tag) => customElements.get(tag) !== undefined)
  })
  // The upgrade defines the element; it does not guarantee the render that
  // exposes the inner control, so wait for one control of each kind.
  await page.waitForSelector("sk-input input[data-slot='control']")
  await page.waitForSelector("sk-checkbox .sk-checkbox__control")
  await page.waitForSelector("sk-switch .sk-switch__track")
}

/** The served document, with no script executed. */
async function servedHtml(page: Page): Promise<string> {
  const response = await page.request.get("/")
  expect(response.status()).toBe(200)
  return response.text()
}

/**
 * The first `<tag>` in `html` whose own attributes contain `marker`.
 *
 * Assertions below read individual attributes out of a tag rather than pinning
 * the whole tag: Svelte emits attributes in template order, and an assertion
 * that restates that order would fail on a harmless edit while catching nothing.
 */
function tagFor(html: string, tag: string, marker: string): string {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*${marker}[^>]*>`))
  expect(match?.[0], `the server HTML has no <${tag}> matching ${marker}`).toBeTruthy()
  return match?.[0] ?? ""
}

/** A JSON attribute, decoded from the HTML entities the server escaped. */
function jsonAttribute(tag: string, name: string): unknown {
  const raw = tag.match(new RegExp(`${name}="([^"]*)"`))?.[1]
  expect(raw, `no ${name} attribute in ${tag}`).toBeTruthy()
  const decoded = (raw ?? "").replaceAll("&quot;", '"').replaceAll("&amp;", "&")
  return JSON.parse(decoded)
}

/** The module the built HTML loads, resolved against the served origin. */
function entryModule(html: string, baseURL: string): string {
  const src = html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1]
  expect(src, "the built HTML has no module script to hydrate with").toBeTruthy()
  return new URL(src ?? "", baseURL).href
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await waitForUpgrade(page)
})

test("the server renders the whole page as markup", async ({ page }) => {
  const html = await servedHtml(page)

  // The placeholder is gone and a real tree is in its place: the server render
  // ran, and the document is the one `hydrate` will find.
  expect(html).not.toContain("<!--app-html-->")
  expect(html).toContain('<div id="app">')
  expect(html).toMatch(/<h1[^>]*>Santaka UI — Svelte<\/h1>/)

  // No-JavaScript fallback: the attribute is in the served bytes, so a browser
  // that never runs the pre-paint snippet still paints the declared theme.
  expect(html).toContain('<html lang="en" data-sk-theme="light">')

  // Every form control is present as a custom element, not as a native control
  // an SSR path might have substituted.
  for (const [tag, marker] of [
    ["sk-input", 'name="email"'],
    ["sk-input", 'name="name"'],
    ["sk-textarea", 'name="bio"'],
    ["sk-select", 'name="plan"'],
    ["sk-checkbox", 'name="terms"'],
    ["sk-switch", 'name="updates"'],
    ["sk-radio-group", 'name="tier"'],
  ] as const) {
    tagFor(html, tag, marker)
  }

  // `required` is a boolean attribute, so it survives as `required=""`.
  const email = tagFor(html, "sk-input", 'name="email"')
  expect(email).toContain('type="email"')
  expect(email).toContain("required")

  // The serialized options are the element's own contract: the attribute holds
  // JSON, and the server wrote JSON. An array literal here would have rendered
  // as `[object Object]`, which is the defect this assertion exists to catch.
  expect(jsonAttribute(tagFor(html, "sk-select", 'name="plan"'), "options")).toEqual(PLANS)
  expect(jsonAttribute(tagFor(html, "sk-radio-group", 'name="tier"'), "options")).toEqual(TIERS)

  // The two client-only readouts, rendered in their neutral server state. If the
  // server claimed a resolved theme it would be guessing at `localStorage`.
  expect(html).toContain(">not submitted<")
  expect(html).toContain(">unresolved<")

  // Vite injected its own assets, so the served page is the built one and not
  // the template with a hand-written path.
  expect(html).toMatch(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"/)
  expect(entryModule(html, "http://127.0.0.1:4176"))
})

test("the served pre-paint snippet does what the package's snippet does", async ({ page }) => {
  const html = await servedHtml(page)
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1]
  expect(inline, "the served HTML has no inline snippet").toBeTruthy()

  // A classic script in `<head>` runs during parsing; a module script is
  // deferred. So the snippet is on the page before anything that could hydrate
  // it, which is why the attribute it sets is the one the first paint uses.
  expect(html.indexOf("<script>")).toBeLessThan(html.indexOf('<script type="module"'))

  // The two copies cannot be compared as text: the HTML one is formatted
  // differently and Vite rewrites its quoting. Comparing what they *do* is both
  // more robust and a stronger claim, because it covers every branch of the
  // decision — the stored preference and the OS preference both matter, and an
  // edit to either copy that changes any outcome fails here.
  const branches = [
    { name: "no stored preference, light OS", stored: null, dark: false, expected: "light" },
    { name: "no stored preference, dark OS", stored: null, dark: true, expected: "dark" },
    { name: "stored dark, light OS", stored: "dark", dark: false, expected: "dark" },
    { name: "stored light, dark OS", stored: "light", dark: true, expected: "light" },
    { name: "stored system, dark OS", stored: "system", dark: true, expected: "dark" },
    { name: "stored system, light OS", stored: "system", dark: false, expected: "light" },
  ] as const

  for (const branch of branches) {
    await page.emulateMedia({ colorScheme: branch.dark ? "dark" : "light" })
    const result = await page.evaluate(
      ({ sourced, packaged, stored }) => {
        const run = (source: string) => {
          // Each run starts from the state a fresh document has: the attribute
          // the served bytes carry, and the storage the snippet would find.
          if (stored === null) localStorage.removeItem("sk-theme")
          else localStorage.setItem("sk-theme", stored)
          document.documentElement.setAttribute("data-sk-theme", "light")
          new Function(source)()
          return document.documentElement.getAttribute("data-sk-theme")
        }
        return { served: run(sourced), packaged: run(packaged) }
      },
      { sourced: inline ?? "", packaged: THEME_INIT_SCRIPT, stored: branch.stored },
    )
    expect(result.served, `${branch.name}: the served snippet`).toBe(branch.expected)
    expect(result.packaged, `${branch.name}: THEME_INIT_SCRIPT`).toBe(branch.expected)
    expect(result.served, `${branch.name}: the two snippets disagree`).toBe(result.packaged)
  }

  // And the served bytes still declare the no-JavaScript fallback, so a browser
  // that runs neither copy still paints the declared theme.
  expect(html).toContain('<html lang="en" data-sk-theme="light">')

  // Leave the page as the other tests expect to find it.
  await page.emulateMedia({ colorScheme: "light" })
  await page.evaluate(() => localStorage.removeItem("sk-theme"))
})

test("hydration reuses the server's DOM instead of replacing it", async ({ page, baseURL }) => {
  const html = await servedHtml(page)
  const entry = entryModule(html, baseURL ?? "http://127.0.0.1:4176")

  // Hold the entry module instead of aborting it, and hold the *same* fetch that
  // the document already started. Aborting would leave the failure cached in the
  // module map, so the module would have to be loaded a second time under a
  // different URL — and Stencil derives its lazy chunk URLs from the URL of the
  // script that loaded it, so a rewritten URL breaks every component chunk. A
  // stalled request has neither problem: the page is the real page, and the
  // module that eventually runs is the one the document asked for.
  let release = () => {}
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(entry, async (route) => {
    await held
    await route.continue()
  })

  // The OS preference is dark and nothing is stored, so the attribute the served
  // bytes carry (`light`) is not the theme in effect. If it is `dark` while the
  // module is still held, the pre-paint snippet set it — nothing else has run.
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/", { waitUntil: "commit" })
  await page.waitForSelector("#app form")

  const before = await page.evaluate(() => {
    return {
      attribute: document.documentElement.getAttribute("data-sk-theme"),
      elements: customElements.get("sk-input") !== undefined,
      headings: document.querySelectorAll("#app h1").length,
      forms: document.querySelectorAll("#app form").length,
      result: document.querySelector("[data-testid='result']")?.textContent?.trim() ?? null,
      theme: document.querySelector("[data-testid='theme-state']")?.textContent ?? null,
    }
  })

  // The server's markup, on its own: no element is defined, so every control is
  // an unknown element that only the stylesheet has touched.
  expect(before.elements).toBe(false)
  expect(before.result).toBe("not submitted")
  expect(before.theme).toBe("unresolved")
  expect(before.attribute).toBe("dark")

  // A property, not an attribute: no renderer manages it, so if `hydrate` keeps
  // the server's nodes this survives, and if it mounted a fresh tree the node it
  // is on would be gone.
  await page.evaluate(() => {
    document.querySelector("#app form")?.setAttribute("data-hydration-probe", "kept")
  })

  release()
  await page.waitForFunction(() => customElements.get("sk-input") !== undefined)
  await page.waitForSelector("sk-input input[data-slot='control']")

  const after = await page.evaluate(() => ({
    probe: document.querySelector("#app form")?.getAttribute("data-hydration-probe") ?? null,
    // Svelte's own marker for the boundary it hydrated. A failed hydration
    // clears the target and mounts again, and a fresh mount has no markers, so
    // this distinguishes "hydrated" from "re-rendered and looks the same".
    markers: document.querySelector("#app")?.innerHTML.includes("<!--[") ?? false,
    headings: document.querySelectorAll("#app h1").length,
    forms: document.querySelectorAll("#app form").length,
    theme: document.querySelector("[data-testid='theme-state']")?.textContent ?? null,
  }))

  // The server's node is the node the app is running on, and the tree was not
  // duplicated by a second render into the same container.
  expect(after.probe).toBe("kept")
  expect(after.markers).toBe(true)
  expect(after.headings).toBe(1)
  expect(after.forms).toBe(1)

  // `onMount` ran, so the client render took over the server's markup: the
  // client-only readout moved off the neutral value the server rendered, and it
  // agrees with the attribute the snippet had already set.
  expect(after.theme).toBe("dark")

  await page.emulateMedia({ colorScheme: "light" })
})

test("props reach the elements and the element's own events reach the app", async ({ page }) => {
  // A prop the server serialized: the select rendered its options from the
  // attribute, and the placeholder is a real first option.
  const labels = await page.locator("sk-select[name='plan'] option").allTextContents()
  expect(labels).toEqual(["Choose a plan", "Free", "Pro"])

  // `options` is one prop with two routes: an attribute the server wrote (the
  // element reads it at upgrade) and a property Svelte assigns (the element
  // accepts the serialized string there too, which is why `parseOptions` handles
  // both). Both are asserted because either one alone would leave the other
  // silently broken.
  const options = await page.evaluate(() => {
    const element = document.querySelector("sk-select[name='plan']")
    return {
      attribute: element?.getAttribute("options") ?? null,
      property: (element as unknown as { options?: unknown }).options,
      rendered: element?.querySelectorAll("option").length ?? 0,
    }
  })
  expect(options.attribute).toBe(JSON.stringify(PLANS))
  expect(options.property).toBe(JSON.stringify(PLANS))
  expect(options.rendered).toBe(3)

  // The binding first, on its own: a `sk-value-change` the app receives is the
  // app's listener, no matter what raised it. This is the half that a wrong
  // event spelling in Svelte would break — and Svelte cannot typecheck an event
  // name, so a test is the only thing that would notice.
  await page.evaluate(() => {
    document.querySelector("sk-input[name='live']")?.dispatchEvent(
      new CustomEvent("sk-value-change", {
        detail: { value: "from the element" },
        bubbles: true,
      }),
    )
  })
  await expect(page.locator("[data-testid='event-detail']")).toHaveText(/from the element/)

  // Then the element's own dispatch path. `sk-value-change` fires on `change`,
  // once the control commits, and only for changes that came from the control —
  // `fill()` would set the value and never commit, so this types and then leaves
  // the field.
  const control = page.locator("sk-input[name='live'] input[data-slot='control']")
  await control.click()
  await control.pressSequentially("typed")
  await control.press("Tab")
  await expect(page.locator("[data-testid='event-detail']")).toHaveText(/typed/)
})

test("the theme toggle responds to a pointer and to the keyboard", async ({ page }) => {
  const toggle = page.locator("sk-button[data-testid='theme-toggle']")
  const readout = page.locator("[data-testid='theme-state']")
  const attribute = () =>
    page.evaluate(() => document.documentElement.getAttribute("data-sk-theme"))

  // The values are not asserted absolutely: the machine running this suite
  // reports its own `prefers-color-scheme`.
  const start = await readout.textContent()
  await toggle.click()
  const afterClick = await readout.textContent()
  expect(afterClick).not.toBe(start)
  expect(await attribute()).toBe(afterClick)

  // One storage key, written by the store, not by the example.
  expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe(
    afterClick,
  )

  // `sk-button` sets `tabindex="0"` on its host and turns Enter into a click
  // itself, which is the half of the a11y ignores in App.svelte that Svelte
  // cannot see. Driving it here is what keeps that comment honest.
  await toggle.focus()
  await page.keyboard.press("Enter")
  await expect(readout).not.toHaveText(afterClick ?? "")
  expect(await attribute()).toBe(await readout.textContent())
})

test("renders every control as a custom element, not a native input", async ({ page }) => {
  // The Svelte example must not substitute native elements: if it did, the FACE
  // behavior would be a re-implementation and the ownership rule would be
  // violated. A bare `<input>` outside a custom element would be that failure.
  const nativeOutsideElements = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll("input, select, textarea")).filter(
        (el) =>
          el.closest("sk-input, sk-select, sk-textarea, sk-checkbox, sk-switch, sk-radio-group") ===
          null,
      ).length,
  )
  expect(nativeOutsideElements).toBe(0)
})

test("submits every named control through the browser's own FormData", async ({ page }) => {
  await page.locator("sk-input[name='email'] input[data-slot='control']").fill("ada@example.com")
  await page.locator("sk-input[name='name'] input[data-slot='control']").fill("Ada Lovelace")
  await page.locator("sk-textarea[name='bio'] textarea[data-slot='control']").fill("Mathematician")
  await page.locator("sk-select[name='plan'] select[data-slot='control']").selectOption("pro")
  await page.locator("sk-checkbox[name='terms'] .sk-checkbox__control").click()
  await page.locator("sk-switch[name='updates'] .sk-switch__track").click()
  await page.locator("sk-radio-group[name='tier'] input[value='premium']").check()

  await page.locator("sk-button[type='submit']").click()

  const entries = await submitted(page)
  expect(entries).not.toBeNull()

  // `Object.fromEntries` would hide a duplicate, so assert the pairs directly.
  const asObject = Object.fromEntries(entries ?? [])
  expect(asObject).toMatchObject({
    email: "ada@example.com",
    name: "Ada Lovelace",
    bio: "Mathematician",
    plan: "pro",
    // `"accepted"`, not the platform default `"on"`: the example passes
    // `value="accepted"`.
    terms: "accepted",
    updates: "on",
    tier: "premium",
  })

  // Every control contributed exactly one entry — the check that catches a
  // control that renders and validates but is silently absent from the
  // submission, which is the defect class this test exists to find.
  expect((entries ?? []).map(([name]) => name).sort()).toEqual([
    "bio",
    "email",
    "name",
    "plan",
    "terms",
    "tier",
    "updates",
  ])
})

test("an unchecked box and an off switch are withheld, not submitted empty", async ({ page }) => {
  await page.locator("sk-input[name='email'] input[data-slot='control']").fill("ada@example.com")
  await page.locator("sk-button[type='submit']").click()

  const names = ((await submitted(page)) ?? []).map(([name]) => name)
  // The platform withholds an unchecked checkbox and an off switch entirely.
  // Submitting `terms=""` would be a different, and wrong, claim.
  expect(names).not.toContain("terms")
  expect(names).not.toContain("updates")
})

test("the browser blocks submission on a required field, and the app does not", async ({
  page,
}) => {
  // `email` is required. Submit with it empty: native constraint validation
  // stops the submit event, so the app's own handler never runs and the output
  // still reads "not submitted". A re-implementation of validation inside the
  // Svelte component would run the handler and produce entries.
  await page.locator("sk-button[type='submit']").click()
  await expect(page.locator("[data-testid='result']")).toHaveText("not submitted")

  // And the element reports the constraint itself.
  const invalid = await page.evaluate(
    () => document.querySelector("sk-input[name='email']")?.matches(":invalid") ?? null,
  )
  expect(invalid).toBe(true)
})

test("reset restores the initial values the server rendered", async ({ page }) => {
  const email = page.locator("sk-input[name='email'] input[data-slot='control']")
  await email.fill("changed@example.com")
  await page.locator("sk-checkbox[name='terms'] .sk-checkbox__control").click()

  await page.locator("sk-button[type='reset']").click()

  await expect(email).toHaveValue("")
  const entries = await submitted(page)
  expect((entries ?? []).map(([name]) => name)).not.toContain("terms")
})

test("the value reaches FormData, not Svelte state", async ({ page }) => {
  // Fill through the DOM, then read the form directly without submitting. This
  // distinguishes "the browser knows the value" from "Svelte was told about it":
  // nothing here dispatches a Svelte event.
  await page.locator("sk-input[name='name'] input[data-slot='control']").fill("Grace Hopper")
  const value = await page.evaluate(() => {
    const form = document.querySelector("form[data-testid='form']")
    return form === null ? null : new FormData(form as HTMLFormElement).get("name")
  })
  expect(value).toBe("Grace Hopper")
})

test("the Svelte-rendered controls carry the brutalist chrome", async ({ page }) => {
  // The example must not bypass the stylesheet: an element rendered through
  // Svelte is the same element, so it gets the same 3px stroke and zero radius.
  // This is the cross-check that the page is exercising the real build.
  const style = await page.locator("sk-button[type='submit']").evaluate((el) => {
    const cs = getComputedStyle(el)
    return { borderWidth: cs.borderTopWidth, radius: cs.borderTopLeftRadius }
  })
  expect(style.borderWidth).toBe("3px")
  expect(style.radius).toBe("0px")
})
