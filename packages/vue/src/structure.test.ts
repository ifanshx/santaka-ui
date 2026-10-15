import { h } from "vue"
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { Label, type SkLabelElement } from "./label.js"
import { Separator, type SkSeparatorElement } from "./separator.js"
import { Card, type SkCardElement } from "./card.js"
import { Text, type SkTextElement } from "./text.js"

/**
 * Adapter contract tests for the structure components.
 *
 * Label's mapping is the one worth pinning: the Vue prop is `htmlFor`, the
 * element's attribute is `for`, and the custom element's own prop is `forId`
 * bound to the `for` attribute — three names for one association, and the test
 * asserts the journey ends at the right attribute.
 *
 * The other two components exist to apply a step *without* taking over the
 * consumer's markup, so their tests are mostly about what the adapter does not
 * do: no wrapper, no rewritten heading level.
 */
describe("Label", () => {
  it("maps htmlFor onto the element's for attribute", () => {
    const wrapper = mount(Label, { props: { htmlFor: "email" }, slots: { default: "Email" } })
    // The DOM attribute is what the browser's label activation reads, so this is
    // the assertion that matters — not the prop name on the wrapper. Vue writes
    // it as an attribute because `"for" in element` is false on a custom element
    // that is not a `<label>`.
    expect(wrapper.element.getAttribute("for")).toBe("email")
  })

  it("writes the attribute, not the forId property", () => {
    // The element binds `forId` to the `for` attribute; a consumer reading the
    // element should find the association in the DOM, not in a property that a
    // browser's label activation never looks at.
    const wrapper = mount(Label, { props: { htmlFor: "email" } })
    expect(wrapper.element.hasAttribute("for")).toBe(true)
    expect((wrapper.element as SkLabelElement).forId).toBe("")
  })

  it("maps the required marker and its position", () => {
    const wrapper = mount(Label, {
      props: { htmlFor: "email", required: true, marker: "before" },
    })
    const element = wrapper.element as SkLabelElement
    expect(element.required).toBe(true)
    expect(element.marker).toBe("before")
  })

  it("leaves required and marker unset by default", () => {
    const element = mount(Label, { props: { htmlFor: "email" } }).element as SkLabelElement
    expect(element.required).toBe(false)
    expect(element.marker).toBe("after")
  })

  it("renders children into the element's slot", () => {
    const wrapper = mount(Label, { props: { htmlFor: "email" }, slots: { default: "Email" } })
    expect(wrapper.text()).toBe("Email")
  })
})

describe("Separator", () => {
  it("renders the custom element with no slot", () => {
    // A separator has no content; the `<hr>` is the element.
    const wrapper = mount(Separator)
    expect(wrapper.element.tagName).toBe("SK-SEPARATOR")
  })

  it("maps orientation, decorative, and label", () => {
    const wrapper = mount(Separator, {
      props: { orientation: "vertical", decorative: true, label: "or" },
    })
    const element = wrapper.element as SkSeparatorElement
    expect(element.orientation).toBe("vertical")
    expect(element.decorative).toBe(true)
    expect(element.label).toBe("or")
  })

  it("defaults to a horizontal line", () => {
    const element = mount(Separator).element as SkSeparatorElement
    expect(element.orientation).toBe("horizontal")
    expect(element.decorative).toBe(false)
  })
})

describe("Card", () => {
  it("renders the custom element with no props set", () => {
    const wrapper = mount(Card, { slots: { default: "Body" } })
    // Undefined props must not reach the element as the string "undefined",
    // which would put `variant="undefined"` on a reflected attribute.
    expect(wrapper.element.hasAttribute("variant")).toBe(false)
    expect(wrapper.element.hasAttribute("padding")).toBe(false)
  })

  it("maps variant and padding", () => {
    const wrapper = mount(Card, { props: { variant: "bare", padding: "lg" } })
    const element = wrapper.element as SkCardElement
    expect(element.variant).toBe("bare")
    expect(element.padding).toBe("lg")
  })

  it("maps heading and subtitle", () => {
    const wrapper = mount(Card, { props: { heading: "Queued", subtitle: "Waiting on a runner" } })
    const element = wrapper.element as SkCardElement
    expect(element.heading).toBe("Queued")
    expect(element.subtitle).toBe("Waiting on a runner")
  })

  it("passes children into the light DOM without wrapping them", () => {
    // Slot assignment is the browser's job in scoped mode, so the adapter must
    // render children verbatim. Wrapping them would break `slot="header"`, since
    // a wrapper would become the slotted node instead of the heading itself.
    const wrapper = mount(Card, {
      slots: { default: () => [h("h2", { slot: "header" }, "Deployment"), h("p", null, "Body")] },
    })
    expect(wrapper.element.querySelector('h2[slot="header"]')).not.toBeNull()
    expect(wrapper.element.querySelector("p")).not.toBeNull()
    // The header is a direct child of the card, not nested inside a wrapper.
    expect(wrapper.element.firstElementChild?.tagName).toBe("H2")
  })

  it("keeps the header attribute rather than promoting it", () => {
    // A card must not invent document structure: the consumer's heading level is
    // theirs to choose, and the adapter has no business rewriting it.
    const wrapper = mount(Card, { slots: { default: () => h("h3", { slot: "header" }, "Third") } })
    const heading = wrapper.element.querySelector("h3")!
    expect(heading.tagName).toBe("H3")
    expect(heading.getAttribute("slot")).toBe("header")
  })

  it("renders with no children at all", () => {
    // A card whose slots are all empty is a legal, if pointless, card.
    expect(mount(Card).element.tagName).toBe("SK-CARD")
  })
})

describe("Text", () => {
  it("renders the custom element with no props set", () => {
    const wrapper = mount(Text, { slots: { default: "Body" } })
    // Undefined props must not arrive as the string "undefined", which would put
    // `variant="undefined"` on a reflected attribute and match no CSS rule.
    expect(wrapper.element.hasAttribute("variant")).toBe(false)
    expect(wrapper.element.hasAttribute("family")).toBe(false)
  })

  it("maps variant and family", () => {
    const wrapper = mount(Text, { props: { variant: "display", family: "display" } })
    const element = wrapper.element as SkTextElement
    expect(element.variant).toBe("display")
    expect(element.family).toBe("display")
  })

  it("maps muted", () => {
    const wrapper = mount(Text, { props: { muted: true } })
    expect((wrapper.element as SkTextElement).muted).toBe(true)
  })

  it("renders the consumer's element as a direct child", () => {
    // No wrapper, no `as` prop: the heading stays a heading, and the outline
    // stays the consumer's. If this ever renders an intermediary element, the
    // component has started owning document structure.
    const wrapper = mount(Text, {
      props: { variant: "lg" },
      slots: { default: () => h("h2", null, "Section") },
    })
    expect(wrapper.element.firstElementChild?.tagName).toBe("H2")
    expect(wrapper.element.querySelector("h2")?.textContent).toBe("Section")
  })

  it("renders with no children at all", () => {
    expect(mount(Text).element.tagName).toBe("SK-TEXT")
  })
})
