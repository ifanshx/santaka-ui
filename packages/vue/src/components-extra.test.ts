import { h } from "vue"
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { Alert, type SkAlertElement } from "./alert.js"
import { Progress, type SkProgressElement } from "./progress.js"
import { EmptyState, type SkEmptyStateElement } from "./empty-state.js"
import {
  Accordion,
  AccordionItem,
  type SkAccordionElement,
  type SkAccordionItemElement,
} from "./accordion.js"
import { Table, type SkTableElement } from "./table.js"

/**
 * Adapter contract tests for the feedback-and-disclosure components: the tag
 * rendered, props mapped onto the custom element, children into the default
 * slot, named slots forwarded, and reactivity — a prop change reaches the
 * element. The behavior itself is owned by `@santaka-ui/web-components` and
 * proven in Chromium in that package's Playwright suite.
 *
 * The property-vs-attribute distinction follows `props.ts`: `elementProps`
 * forwards every value except `undefined`, so a prop a consumer leaves unset
 * never arrives as the string `"undefined"` on a reflected attribute, and a
 * custom element's property-backed props (not `in`/`hasAttribute`) are the
 * mapping asserted here.
 */
describe("Alert adapter", () => {
  it("renders the custom element", () => {
    expect(mount(Alert).element.tagName).toBe("SK-ALERT")
  })

  it("maps variant and heading onto the element", () => {
    const element = mount(Alert, { props: { variant: "danger", heading: "Deploy failed" } })
      .element as SkAlertElement
    expect(element.variant).toBe("danger")
    expect(element.heading).toBe("Deploy failed")
  })

  it("leaves props unset by default", () => {
    // Undefined props must not reach the element as the string "undefined",
    // which would put `variant="undefined"` on a reflected attribute.
    const wrapper = mount(Alert)
    expect(wrapper.element.hasAttribute("variant")).toBe(false)
    expect(wrapper.element.hasAttribute("heading")).toBe(false)
    expect((wrapper.element as SkAlertElement).variant).toBe("neutral")
  })

  it("renders children into the default slot and forwards the actions slot", () => {
    // Named slots are children carrying `slot`, not a Vue named-slot call:
    // a custom element is not a Vue component, so Vue does not distribute a
    // `slots.actions` entry the way it would between two components. The
    // light-DOM `slot` attribute is what the element's own `<slot name>`
    // assigns, per the Card convention.
    const wrapper = mount(Alert, {
      slots: {
        default: () => [h("p", null, "Task queued"), h("button", { slot: "actions" }, "Retry")],
      },
    })
    expect(wrapper.element.querySelector("p")?.textContent).toBe("Task queued")
    const actions = wrapper.element.querySelector('[slot="actions"]')
    expect(actions).not.toBeNull()
    expect(actions?.textContent).toBe("Retry")
  })

  it("keeps the consumer's role when the element fits one in", () => {
    // The element writes `role="alert"` for danger when the host carries none;
    // the stub is inert, so what the adapter must guarantee is that neither the
    // prop pass nor the element props overwrite a consumer's role — mirroring
    // the element's documented hasAttribute check.
    const element = mount(Alert, { props: { variant: "danger" }, attrs: { role: "log" } })
      .element as SkAlertElement
    expect(element.getAttribute("role")).toBe("log")
  })

  it("updates the element when a prop changes", async () => {
    const wrapper = mount(Alert, { props: { variant: "neutral" } })
    await wrapper.setProps({ variant: "warning" })
    expect((wrapper.element as SkAlertElement).variant).toBe("warning")
  })
})

describe("Progress adapter", () => {
  it("renders the custom element", () => {
    expect(mount(Progress).element.tagName).toBe("SK-PROGRESS")
  })

  it("maps value, max, label, and size", () => {
    const element = mount(Progress, {
      props: { value: 40, max: 200, label: "Uploading", size: "lg" },
    }).element as SkProgressElement
    expect(element.value).toBe(40)
    expect(element.max).toBe(200)
    expect(element.label).toBe("Uploading")
    expect(element.size).toBe("lg")
  })

  it("stays indeterminate when value is left unset", () => {
    // An unset value is the sweep's signal — the adapter must not write 0, so
    // the element's own contract (data-indeterminate, no aria-valuenow) still
    // has an absent `value` to read. Asserted on the property, since the
    // attribute wiring is the element's render, not the adapter's.
    const element = mount(Progress).element as SkProgressElement
    expect(element.value).toBeUndefined()
  })

  it("updates the value property when value changes", async () => {
    const wrapper = mount(Progress, { props: { value: 10 } })
    await wrapper.setProps({ value: 90 })
    expect((wrapper.element as SkProgressElement).value).toBe(90)
  })
})

describe("EmptyState adapter", () => {
  it("renders the custom element", () => {
    expect(mount(EmptyState).element.tagName).toBe("SK-EMPTY-STATE")
  })

  it("maps variant, size, heading, and description", () => {
    const element = mount(EmptyState, {
      props: { variant: "bare", size: "sm", heading: "No runs", description: "Trigger one" },
    }).element as SkEmptyStateElement
    expect(element.variant).toBe("bare")
    expect(element.size).toBe("sm")
    expect(element.heading).toBe("No runs")
    expect(element.description).toBe("Trigger one")
  })

  it("renders body children verbatim and named slots as light-DOM children", () => {
    // Same as Alert: a custom element is not a Vue component, so named slots
    // are authored children with a `slot` attribute, which the element's own
    // `<slot name>` assigns.
    const wrapper = mount(EmptyState, {
      slots: {
        default: () => [
          h("p", null, "Nothing here yet"),
          h("span", { slot: "icon" }, "icon"),
          h("button", { slot: "actions" }, "Create"),
        ],
      },
    })
    expect(wrapper.element.querySelector("p")?.textContent).toBe("Nothing here yet")
    expect(wrapper.element.querySelector('[slot="icon"]')?.textContent).toBe("icon")
    expect(wrapper.element.querySelector('[slot="actions"]')?.textContent).toBe("Create")
  })

  it("has no role and is not focusable", () => {
    // A placeholder surface is not a control; the element renders no role and
    // the adapter must not invent one.
    const element = mount(EmptyState).element as SkEmptyStateElement
    expect(element.getAttribute("role")).toBeNull()
    expect(element.tabIndex).toBe(-1)
  })

  it("updates the element when a prop changes", async () => {
    const wrapper = mount(EmptyState, { props: { variant: "default" } })
    await wrapper.setProps({ variant: "bare" })
    expect((wrapper.element as SkEmptyStateElement).variant).toBe("bare")
  })
})

describe("Accordion adapter", () => {
  it("renders the group and the item as their own custom elements", () => {
    expect(
      mount(Accordion, { slots: { default: () => h(AccordionItem) } })
        .find("sk-accordion-item")
        .exists(),
    ).toBe(true)
    expect(mount(AccordionItem).element.tagName).toBe("SK-ACCORDION-ITEM")
  })

  it("maps multiple and variant onto the group element", () => {
    const element = mount(Accordion, { props: { multiple: true, variant: "plain" } })
      .element as SkAccordionElement
    expect(element.multiple).toBe(true)
    expect(element.variant).toBe("plain")
  })

  it("maps the item's heading onto the element", () => {
    const element = mount(AccordionItem, { props: { heading: "Deployment log" } })
      .element as SkAccordionItemElement
    expect(element.heading).toBe("Deployment log")
  })

  it("maps the controlled open write and keeps it unset by default", () => {
    // `open` on the real element is reflectable (mirrors `<details open>`), so
    // a controlled write must land on the property the element mirrors back on
    // a user toggle. The stub carries the default; the real reflectance is
    // proven in web-components' own suite.
    const openItem = mount(AccordionItem, { props: { open: true } })
      .element as SkAccordionItemElement
    expect(openItem.open).toBe(true)

    // Omitting `open` must leave the element alone, not write false over its
    // own state.
    expect(mount(AccordionItem).element.hasAttribute("open")).toBe(false)
  })

  it("renders item children into the default slot", () => {
    const wrapper = mount(AccordionItem, { slots: { default: "Panel body" } })
    expect(wrapper.text()).toContain("Panel body")
  })

  it("calls onOpenChange when an item's sk-open-change fires", () => {
    // One listener on the group host per the element's own design: the event
    // bubbles from the item, so the adapter wires it on `sk-accordion` only.
    const onOpenChange = vi.fn()
    mount(Accordion, { props: { onOpenChange } }).element.dispatchEvent(
      new CustomEvent("sk-open-change", { detail: { open: true }, bubbles: true }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("leaves onOpenChange unset without crashing", () => {
    const wrapper = mount(Accordion)
    expect(() =>
      wrapper.element.dispatchEvent(
        new CustomEvent("sk-open-change", { detail: { open: true }, bubbles: true }),
      ),
    ).not.toThrow()
  })

  it("updates the item when open changes via props", async () => {
    const wrapper = mount(AccordionItem, { props: { open: false } })
    await wrapper.setProps({ open: true })
    expect((wrapper.element as SkAccordionItemElement).open).toBe(true)
  })
})

describe("Table adapter", () => {
  it("renders the custom element", () => {
    expect(mount(Table).element.tagName).toBe("SK-TABLE")
  })

  it("maps variant, density, striped, and label", () => {
    const element = mount(Table, {
      props: { variant: "plain", density: "compact", striped: true, label: "Queue" },
    }).element as SkTableElement
    expect(element.variant).toBe("plain")
    expect(element.density).toBe("compact")
    expect(element.striped).toBe(true)
    expect(element.label).toBe("Queue")
  })

  it("renders the consumer's table verbatim into the slot", () => {
    // The component is a skin over a table the consumer writes, so the adapter
    // must render children unwrapped — the table's own semantics are the
    // accessibility story.
    const wrapper = mount(Table, {
      slots: { default: () => h("table", null, h("tr", null, h("td", null, "row"))) },
    })
    expect(wrapper.element.querySelector("td")?.textContent).toBe("row")
  })

  it("updates the element when a prop changes", async () => {
    const wrapper = mount(Table, { props: { density: "default" } })
    await wrapper.setProps({ density: "compact" })
    expect((wrapper.element as SkTableElement).density).toBe("compact")
  })
})
