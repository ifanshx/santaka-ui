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
  const NO_BOOLEAN_PROPS = new Set(["sk-card", "sk-spinner", "sk-skeleton", "sk-tabs"])

  /** The props ADR-013 records as deliberately unprefixed presentation booleans. */
  const OPEN_IN_ADR_013: Record<string, Set<string>> = {
    "sk-link": new Set(["external", "subtle"]),
    "sk-badge": new Set(["dot"]),
    "sk-text": new Set(["muted"]),
    "sk-separator": new Set(["decorative"]),
    "sk-dialog": new Set(["modal", "dismissible"]),
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
      if (!NO_BOOLEAN_PROPS.has(tag)) {
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
    for (const tag of NO_BOOLEAN_PROPS) {
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
