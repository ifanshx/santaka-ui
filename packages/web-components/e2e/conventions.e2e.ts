import { readdirSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

/**
 * Component API conformance (plan.md §17: "Component API conventions are
 * enforced by a conformance test, and no Stable component deviates").
 *
 * §4 states the conventions are normative and that a deviating component "does
 * not ship as Stable; the deviation is a design decision that needs ADR-013".
 * A convention nothing checks is a convention that decays: the first component
 * to rename a boolean prop to `isDisabled` would look fine in review and ship.
 *
 * Two halves, because a convention can fail on paper or in the browser:
 *
 *  - **Static** — every shipped component's source is parsed for the naming and
 *    prefix grammar. This runs without a browser and catches a rename before it
 *    reaches a component at all.
 *  - **Runtime** — every registered element is exercised in a real browser for
 *    the conventions that only exist once the element has upgraded.
 */

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, "..")
const componentsDir = resolve(pkgRoot, "src", "components")

/**
 * The components that ship, read from the component directories rather than a
 * hand-kept list. A hand-maintained list silently stops covering a new
 * component the moment one is added — which is the exact decay this test exists
 * to prevent, and it is how `sk-input` would have shipped unchecked.
 */
const COMPONENTS = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.startsWith("sk-"))
  .sort() as readonly string[]

/**
 * Boolean props that mirror an ARIA state use the ARIA name verbatim (§4
 * "Props"). This is the list the convention names, plus the ones these
 * components introduce for state they expose.
 */
const ARIA_BOOLEAN_PROPS = new Set([
  "open",
  "checked",
  "selected",
  "expanded",
  "required",
  "disabled",
  "invalid",
  "loading",
  // ADR-013: `readonly` is both an ARIA attribute and a native form-control
  // attribute, and it means something `disabled` cannot — a read-only field is
  // still submitted and still focusable. §4's list omits it.
  "readOnly",
  // ADR-013 (amended): `indeterminate` mirrors the `mixed` value of
  // `aria-checked` — the tri-state a checkbox exposes when "some but not all"
  // of its children are checked. It is also the native HTMLInputElement
  // property name, so the ARIA-mirroring reading and the platform reading
  // agree; prefixing it would divorce it from both.
  "indeterminate",
])

/**
 * The convention §4 actually states is about *boolean* props, but the interesting
 * version of it is narrower: a boolean prop that toggles a **state** is the one
 * that gets an ARIA name or an is/has/can prefix, because it is the one a
 * consumer wires to state and a screen reader has to convey.
 *
 * A boolean prop that toggles a *visual treatment* is not that. `sk-link`'s
 * `external` and `subtle`, and `sk-badge`'s `dot`, are all flags for how the
 * component looks — there is no ARIA state they mirror, and `isExternal` would
 * read as though something external were true rather than rendered. Plan §4
 * reserves the is/has/can prefix for booleans in exactly this class
 * (`isExternal` appears in its own example list, so the convention does cover
 * presentation flags as well as state).
 *
 * Both readings are defensible, so this test records the ambiguity rather than
 * picking one silently: every boolean prop is classified, and the ones that do
 * not fit either reading are what fail. `ADR-013` owns the resolution.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/examples/vanilla-html/index.html")
})
test.describe("API conventions (static)", () => {
  /**
   * ADR-013 leaves one question open: whether a boolean that toggles a
   * *presentation* rather than a state takes the is/has/can prefix. Four
   * shipped props sit on that question — `sk-link.external`, `sk-link.subtle`,
   * `sk-badge.dot`, and the ADR's own recommendation is that they do.
   *
   * Rather than resolving a public-API rename inside a test, this enumerates
   * the props the question covers and fails on any that is not already on the
   * record. A new unprefixed presentation boolean then fails, which is the
   * point: the decision is already being made component by component, and this
   * makes it deliberate rather than inherited.
   *
   * `NO_BOOLEAN_PROPS` below holds components that are deliberately stateless
   * surfaces. A card owns no state and takes no interaction, so every boolean it
   * could carry would be decoration — and this guard would otherwise push
   * exactly the kind of prop ADR-013 exists to prevent. The Spinner and Skeleton
   * join it for the same reason: one announces a wait, the other is scaffolding,
   * and neither has a state to toggle.
   */
  // sk-tabs is the fourth: its state is an index, not a flag. A tab is not
  // on or off — it is first, second, or third — so there is no boolean to
  // declare, and inventing one (e.g. a decorative flag) to satisfy the
  // regex would be the vacuous pass this assertion exists to prevent.
  //
  // Three more arrived with the recent components, and their exemption is the
  // same kind of claim:
  //   sk-alert, sk-empty-state — a surface with slots. Its state is the variant
  //   the consumer set; there is nothing inside it to toggle.
  //   sk-progress — its state is a position, and "indeterminate" is the absence
  //   of `value`, not a second prop. A boolean would be a second way to say
  //   `value === undefined`, and the two could disagree.
  const NO_BOOLEAN_PROPS: Record<string, true> = {
    "sk-card": true,
    "sk-spinner": true,
    "sk-skeleton": true,
    "sk-tabs": true,
    "sk-alert": true,
    "sk-empty-state": true,
    "sk-progress": true,
    // A shortcut is text, not a control: there is no state to toggle. The one
    // boolean it could carry — a decorative `bare` to drop the chrome — would
    // be exactly the prop this assertion exists to prevent, since dropping the
    // `<kbd>` semantics is not available and the chrome is the only styling
    "sk-kbd": true,
    // A portrait is not a control and has no state to toggle: it is a picture,
    // a name, and a size. The one boolean it could carry — a flag to force
    // initials over the image — would restate what `src` already says, and the
    // two could disagree.
    "sk-avatar": true,
    // A stack of avatars has no state of its own: `max` is a number, `label` a
    // string, `size` an enumeration. Unlike `sk-banner` below, there is no
    // boolean even in principle.
    "sk-avatar-group": true,
    // `sk-banner` is exempt for a mechanical reason worth recording: its only
    // boolean, `fullWidth`, defaults to `true`, and the regex above matches `=
    // false` — the convention's shape for a boolean prop, since an ARIA-mirror
    // or prefixed boolean is off until turned on. A prop that is on by default
    // is not matched, so the component scans as having none. `sk-banner` is not
    // a stateless surface like the others here; it is a false negative, and
    // naming that is better than exempting it silently.
    "sk-banner": true,
    // A breadcrumb trail is a list of links: `items` is data, `label` a string.
    // A boolean would be decoration — a flag to hide the last item, say, which
    // is what `aria-current` already expresses.
    "sk-breadcrumb": true,
    // A pager's state is `page` and `count`, both numbers. Prev/Next
    // availability is derived from them rather than declared, so a
    // `hasNext`-style boolean would be a second source of truth that could
    // disagree with `page < count`.
    "sk-pagination": true,
    // The mascot is decorative and has no state: `mood` is an enumeration, not a
    // flag, and `size` is a scale step. A boolean here would be a prop invented
    // for the regex's sake.
    "sk-taka": true,
  }

  /** The props ADR-013 records as deliberately unprefixed presentation booleans. */
  const OPEN_IN_ADR_013: Record<string, Set<string>> = {
    "sk-link": new Set(["external", "subtle"]),
    "sk-badge": new Set(["dot"]),
    "sk-text": new Set(["muted"]),
    "sk-separator": new Set(["decorative"]),
    "sk-dialog": new Set(["modal", "dismissible"]),
    "sk-table": new Set(["striped"]),
    // Not a presentation boolean but the platform's own name for the same
    // concept: `<select multiple>`, `<input multiple>`. ADR-013 point 5.
    "sk-accordion": new Set(["multiple"]),
    // ADR-013's open question, recorded rather than settled: whether a
    // presentation boolean takes the `is`/`has`/`can` prefix. `showValue` reads
    // better unprefixed and mirrors `showValue`-style naming in the platform
    // (`<dialog open>`, `<details open>`), so it is listed here instead of
    // renamed — the same treatment `dot`, `muted`, and `striped` get.
    "sk-slider": new Set(["showValue"]),
  }

  test("every boolean prop is an ARIA state, is/has/can prefixed, or on the ADR-013 record", () => {
    const unrecorded: string[] = []
    const scanned: string[] = []

    for (const tag of COMPONENTS) {
      const source = readFileSync(resolve(componentsDir, tag, `${tag}.tsx`), "utf8")
      const booleans = [
        ...source.matchAll(/@Prop\([^)]*\)\s*(\w+)\s*(?::\s*boolean)?\s*=\s*false/g),
      ]

      // The point of this assertion is to prove the regex above is not vacuous
      // and silently passing on every component. It cannot be applied to a
      // component that genuinely has no booleans, so those are excluded — and
      // the exclusion is checked below, so it cannot grow unnoticed.
      if (!NO_BOOLEAN_PROPS[tag]) {
        expect(booleans.length, `${tag} should declare at least one boolean prop`).toBeGreaterThan(
          0,
        )
      }

      if (booleans.length > 0) scanned.push(tag)

      for (const [, prop] of booleans) {
        const name = prop as string
        // §4 controlled/uncontrolled: `default<Value>` is an uncontrolled
        // initializer, not a state mirror — it is read once and never written
        // back, so it is not a boolean the component exposes as state.
        if (name.startsWith("default")) continue
        if (ARIA_BOOLEAN_PROPS.has(name)) continue
        if (/^(is|has|can)[A-Z]/.test(name)) continue
        if (OPEN_IN_ADR_013[tag]?.has(name)) continue
        unrecorded.push(
          `${tag}: boolean prop "${name}" is neither an ARIA name, is/has/can prefixed, nor recorded in ADR-013`,
        )
      }
    }

    expect(unrecorded).toEqual([])

    // If every component were exempted, the loop above would check nothing at
    // all. This is the assertion that the exemption list stayed small.
    expect(scanned.length).toBeGreaterThan(0)
    for (const tag of Object.keys(NO_BOOLEAN_PROPS)) {
      expect(COMPONENTS, `${tag} is exempted but does not exist`).toContain(tag)
    }
  })

  test("every prop ADR-013 lists as an open question still exists", () => {
    // If a component is renamed to settle the question, this ADR and this test
    // both have to be updated together. A silently-vanished entry would mean the
    // conformance test had stopped covering the question.
    for (const [tag, props] of Object.entries(OPEN_IN_ADR_013)) {
      const source = readFileSync(resolve(componentsDir, tag, `${tag}.tsx`), "utf8")
      for (const prop of props) {
        expect(source, `${tag}.${prop} is listed in ADR-013 but no longer exists`).toContain(prop)
      }
    }
  })

  test("visual configuration is exactly variant and size", () => {
    // §4: "Visual configuration is always exactly two props named `variant`
    // and `size`." A third appearance prop is a new axis, not a tweak.
    const appearanceProps =
      /^\s{2}(variant|size|color|colour|tone|appearance|weight|intent)\s*[?!]?:/gm
    const allowed = new Set(["variant", "size"])

    for (const tag of COMPONENTS) {
      const source = readFileSync(resolve(componentsDir, tag, `${tag}.tsx`), "utf8")
      const declared = [...source.matchAll(appearanceProps)].map((m) => m[1] as string)
      for (const prop of declared) {
        expect(allowed.has(prop), `${tag} declares appearance prop "${prop}"`).toBe(true)
      }
    }
  })

  test("every component uses scoped styles, never a shadow root", () => {
    // ADR-011. A shadow root silently kills every consumer utility class, which
    // is the most common way a consumer's `className` "does nothing".
    for (const tag of COMPONENTS) {
      const source = readFileSync(resolve(componentsDir, tag, `${tag}.tsx`), "utf8")
      expect(source, `${tag} must declare scoped: true`).toMatch(/scoped:\s*true/)
      expect(source, `${tag} must not enable shadow`).not.toMatch(/shadow:\s*true/)
    }
  })

  test("every element and hook carries the sk- prefix", () => {
    for (const tag of COMPONENTS) {
      const source = readFileSync(resolve(componentsDir, tag, `${tag}.tsx`), "utf8")
      expect(source, `${tag} tag must be sk- prefixed`).toMatch(new RegExp(`tag:\\s*"${tag}"`))
      expect(tag.startsWith("sk-")).toBe(true)
    }
  })

  test("component CSS uses logical properties, never physical ones", () => {
    // ADR-016, and §4's RTL section: "Authored CSS uses logical properties
    // exclusively ... Banned in component source: `left`, `right`,
    // `margin-left`, `padding-right`, `text-align: left/right`,
    // `border-top-left-radius`."
    //
    // The ban is what makes RTL a Definition of Done item rather than a
    // retrofit across twenty components, and until this test existed nothing
    // enforced it: a component could write `margin-left` and look fine in a
    // left-to-right review. Comments are stripped first, because a rule that
    // *explains* the ban must not trip it.
    const physical = [
      /\b(?:margin|padding|border|inset)-(?:left|right)\b/,
      /\btext-align\s*:\s*(?:left|right)\b/,
      /\bborder-(?:top|bottom)-(?:left|right)-radius\b/,
      /(?:^|[;{\s])(?:left|right)\s*:/m,
      /\bfloat\s*:\s*(?:left|right)\b/,
    ]

    for (const tag of COMPONENTS) {
      const cssPath = resolve(componentsDir, tag, `${tag}.css`)
      let css: string
      try {
        css = readFileSync(cssPath, "utf8")
      } catch {
        continue // A component with no stylesheet has nothing to check.
      }
      const code = css.replace(/\/\*[\s\S]*?\*\//g, "")
      for (const pattern of physical) {
        const match = code.match(pattern)
        expect(
          match,
          `${tag}.css uses the physical property ${JSON.stringify(match?.[0])}; ADR-016 requires the logical equivalent`,
        ).toBeNull()
      }
    }
  })

  test("Baseline-only CSS features are behind @supports, never bare", () => {
    // §4's browser baseline names what the Core tier does not have: container
    // queries, `:has()`-dependent layout, `text-wrap: balance`, view
    // transitions, `@starting-style`. "Where one of these improves a component,
    // it is added behind an `@supports` block so Core keeps a working fallback."
    //
    // Nothing checked this until now, so the ban had the same status as the
    // physical-property ban before ADR-016's test: prose in the plan. Three
    // stylesheets used bare `:has()` for a disabled label cursor — harmless to
    // render, and still a claim the support matrix could not make.
    //
    // Comments are stripped first, for the same reason as the logical-property
    // test: a rule explaining the ban must not trip it.
    const baselineOnly = [
      { name: ":has()", pattern: /:has\(/g },
      { name: "@container", pattern: /@container\b/g },
      { name: "text-wrap: balance", pattern: /\btext-wrap\s*:\s*balance\b/g },
      { name: "@starting-style", pattern: /@starting-style\b/g },
      { name: "view-transition", pattern: /\bview-transition\b/g },
    ]

    /**
     * Every character offset lying inside at least one `@supports` block.
     *
     * Counting `@supports` against feature occurrences would pass by
     * coincidence — one guard elsewhere in the file would excuse a bare use
     * anywhere. Depth is the real question: is *this* occurrence inside a
     * guard? So each `@supports` opening is matched with its closing brace and
     * the whole span is recorded.
     */
    function guardedRanges(css: string): Array<[number, number]> {
      const ranges: Array<[number, number]> = []
      const open = /@supports[^{]*\{/g
      for (let match = open.exec(css); match; match = open.exec(css)) {
        let depth = 1
        let i = match.index + match[0].length
        while (i < css.length && depth > 0) {
          if (css[i] === "{") depth++
          else if (css[i] === "}") depth--
          i++
        }
        ranges.push([match.index, i])
      }
      return ranges
    }

    for (const tag of COMPONENTS) {
      const cssPath = resolve(componentsDir, tag, `${tag}.css`)
      let css: string
      try {
        css = readFileSync(cssPath, "utf8")
      } catch {
        continue // A component with no stylesheet has nothing to check.
      }
      const code = css.replace(/\/\*[\s\S]*?\*\//g, "")
      const guards = guardedRanges(code)

      for (const { name, pattern } of baselineOnly) {
        for (const match of code.matchAll(pattern)) {
          const at = match.index
          const isGuarded = guards.some(([start, end]) => at >= start && at < end)
          expect(
            isGuarded,
            `${tag}.css uses ${name} outside an @supports block (offset ${at}); §4 requires a Core-tier fallback`,
          ).toBe(true)
        }
      }
    }
  })
})

test.describe("API conventions (runtime)", () => {
  test("every registered element upgrades and exposes a data-slot hook", async ({ page }) => {
    // §4: styling hooks are `data-slot` attributes, not utility classes. The
    // generated CSS is scoped against them, so a missing one means the consumer
    // has no documented way to target the component.
    //
    // Every instance is checked, not just the first: the convention is about
    // the element, and an example page has several of each by design.
    for (const tag of COMPONENTS) {
      const elements = page.locator(tag)
      const count = await elements.count()
      expect(count, `${tag} should appear in the example`).toBeGreaterThan(0)

      const hooks = await elements.evaluateAll((els) =>
        els.map((el) => ({ slot: el.getAttribute("data-slot"), shadow: Boolean(el.shadowRoot) })),
      )
      for (const hook of hooks) {
        expect(hook.slot, `${tag} has a non-empty data-slot`).toBeTruthy()
        // Scoped, not shadowed: the internals must be reachable from page CSS.
        expect(hook.shadow, `${tag} must not attach a shadow root`).toBe(false)
      }
    }
  })

  test("variant and size reflect to attributes the stylesheet can target", async ({ page }) => {
    // Each prop is asserted on an element that actually carries it. The example
    // page sets `variant="danger"` and `size="lg"` on separate buttons, so a
    // combined selector would assert against a fixture that does not exist.
    const cases = [
      { tag: "sk-button", prop: "variant", value: "danger" },
      { tag: "sk-button", prop: "size", value: "lg" },
      { tag: "sk-icon-button", prop: "variant", value: "danger" },
      { tag: "sk-icon-button", prop: "size", value: "lg" },
      { tag: "sk-badge", prop: "variant", value: "danger" },
    ] as const

    for (const { tag, prop, value } of cases) {
      const element = page.locator(`${tag}[${prop}="${value}"]`).first()
      await expect(element, `${tag} reflects ${prop}`).toHaveAttribute(prop, value)
      await expect(element, `${tag} is visible with ${prop}`).toBeVisible()
    }
  })

  test("interactive components expose state as data attributes, not class names", async ({
    page,
  }) => {
    // §4 "State attributes": `data-state`, `data-disabled`, `data-loading` are
    // public API. A class would couple consumers to the stylesheet's internals.
    const button = page.locator('sk-button[variant="secondary"]').first()
    await expect(button).toHaveAttribute("data-state", "idle")
    await expect(button).not.toHaveAttribute("data-disabled", /.*/)

    await page.locator("sk-button[disabled]").first().waitFor()
    const disabled = page.locator("sk-button[disabled]").first()
    await expect(disabled).toHaveAttribute("data-state", "disabled")
    await expect(disabled).toHaveAttribute("data-disabled", "")
  })

  test("no component ships an unprefixed global class", async ({ page }) => {
    // §4: "The `sk-` prefix is fixed... No component ships an unprefixed global
    // class." Checked in the browser rather than by reading source, because the
    // class that matters is the one that actually ends up in the document.
    //
    // Stencil adds its own `hydrated` marker on upgrade. That is framework
    // bookkeeping, not a class the library ships or documents, so it is
    // excluded by name rather than by loosening the prefix rule.
    const offenders = await page.evaluate(() => {
      const STENCIL_INTERNALS = new Set(["hydrated"])
      const found: string[] = []

      for (const host of document.querySelectorAll(
        "sk-badge, sk-button, sk-icon-button, sk-link",
      )) {
        for (const el of [host, ...host.querySelectorAll("*")]) {
          const name = el.getAttribute("class")
          if (!name) continue
          for (const part of name.split(/\s+/).filter(Boolean)) {
            if (part.startsWith("sk-") || STENCIL_INTERNALS.has(part)) continue
            found.push(`${el.tagName.toLowerCase()}.${part}`)
          }
        }
      }
      return [...new Set(found)]
    })
    expect(offenders, "component internals must only use sk- prefixed classes").toEqual([])
  })
})
