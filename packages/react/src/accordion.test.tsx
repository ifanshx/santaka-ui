import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  Accordion,
  AccordionItem,
  type SkAccordionElement,
  type SkAccordionItemElement,
} from "./accordion.js"

/**
 * Accordion adapter contract tests.
 *
 * The one case with real risk is `multiple` and `open`: both are booleans on
 * the element, and a stringified `multiple="false"` would read as true under
 * attribute-to-property conversion. React 19 writes a property when the
 * defined element has one, and these assertions pin that channel by strict
 * equality on the property.
 */
describe("Accordion", () => {
  it("renders the custom element", () => {
    const { container } = render(<Accordion />)
    expect(container.querySelector("sk-accordion")).not.toBeNull()
  })

  it('maps multiple to a boolean property, not the string "false"', () => {
    const { container } = render(<Accordion multiple={false} />)
    const element = container.querySelector("sk-accordion") as SkAccordionElement
    // Strict equality: "false" (truthy as a string) must not sneak through.
    expect(element.multiple).toBe(false)
    expect(element.multiple).not.toBe("false")
  })

  it("maps explicit multiple to a true boolean property", () => {
    const { container } = render(<Accordion multiple />)
    const element = container.querySelector("sk-accordion") as SkAccordionElement
    expect(element.multiple).toBe(true)
  })

  it("leaves variant at the element default", () => {
    const { container } = render(<Accordion />)
    const element = container.querySelector("sk-accordion") as SkAccordionElement
    expect(element.variant).toBe("default")
  })

  it("passes variant through", () => {
    const { container } = render(<Accordion variant="plain" />)
    const element = container.querySelector("sk-accordion") as SkAccordionElement
    expect(element.variant).toBe("plain")
  })

  it("renders AccordionItem children into the group", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem heading="First" />
        <AccordionItem heading="Second" />
      </Accordion>,
    )
    const group = container.querySelector("sk-accordion")!
    const items = [
      ...group.querySelectorAll(":scope > sk-accordion-item"),
    ] as SkAccordionItemElement[]
    expect(items).toHaveLength(2)
    // The heading is a prop, not rendered text, so it is read back as properties.
    expect(items.map((item) => item.heading)).toEqual(["First", "Second"])
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkAccordionElement>()
    render(<Accordion ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-ACCORDION")
  })

  it("merges className", () => {
    const { container } = render(<Accordion className="my-group" />)
    expect(container.querySelector("sk-accordion")!.className).toBe("my-group")
  })
})

describe("AccordionItem", () => {
  it("passes heading through to the element", () => {
    const { container } = render(<AccordionItem heading="Billing" />)
    const item = container.querySelector("sk-accordion-item") as SkAccordionItemElement
    expect(item.heading).toBe("Billing")
  })

  it('maps open to a boolean property, not the string "false"', () => {
    const { container } = render(<AccordionItem open={false} />)
    const item = container.querySelector("sk-accordion-item") as SkAccordionItemElement
    expect(item.open).toBe(false)
    expect(item.open).not.toBe("false")
  })

  it("maps explicit open to a true boolean property", () => {
    const { container } = render(<AccordionItem open />)
    const item = container.querySelector("sk-accordion-item") as SkAccordionItemElement
    expect(item.open).toBe(true)
  })

  it("renders panel children into the item", () => {
    const { container } = render(
      <AccordionItem heading="Details">
        <p>The full record.</p>
      </AccordionItem>,
    )
    const item = container.querySelector("sk-accordion-item")!
    expect(item.querySelector("p")?.textContent).toBe("The full record.")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkAccordionItemElement>()
    render(<AccordionItem ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-ACCORDION-ITEM")
  })

  it("merges className", () => {
    const { container } = render(<AccordionItem className="my-item" />)
    expect(container.querySelector("sk-accordion-item")!.className).toBe("my-item")
  })
})
