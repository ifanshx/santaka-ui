import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Card, type SkCardElement } from "./card.js"

/**
 * Card adapter contract tests: prop mapping onto the custom element, and the
 * slot passthrough that a slotted component's React adapter most often breaks.
 */
describe("Card", () => {
  it("renders the custom element with no props set", () => {
    const { container } = render(<Card>Body</Card>)
    const element = container.querySelector("sk-card")!
    // Undefined props must not reach the element as the string "undefined",
    // which would put `variant="undefined"` on a reflected attribute.
    expect(element.getAttribute("variant")).toBeNull()
    expect(element.getAttribute("padding")).toBeNull()
  })

  it("maps variant and padding", () => {
    const { container } = render(
      <Card variant="bare" padding="lg">
        Body
      </Card>,
    )
    const element = container.querySelector("sk-card") as SkCardElement
    expect(element.variant).toBe("bare")
    expect(element.padding).toBe("lg")
  })

  it("maps heading and subtitle", () => {
    const { container } = render(<Card heading="Queued" subtitle="Waiting on a runner" />)
    const element = container.querySelector("sk-card") as SkCardElement
    expect(element.heading).toBe("Queued")
    expect(element.subtitle).toBe("Waiting on a runner")
  })

  it("passes children into the light DOM without wrapping them", () => {
    // Slot assignment is the browser's job in scoped mode, so the adapter must
    // render children verbatim. Wrapping them would break `slot="header"`, since
    // a wrapper would become the slotted node instead of the heading itself.
    const { container } = render(
      <Card>
        <h2 slot="header">Deployment</h2>
        <p>Body</p>
      </Card>,
    )
    const element = container.querySelector("sk-card")!
    expect(element.querySelector('h2[slot="header"]')).not.toBeNull()
    expect(element.querySelector("p")).not.toBeNull()
    // The header is a direct child of the card, not nested inside a wrapper.
    expect(element.firstElementChild?.tagName).toBe("H2")
  })

  it("keeps the header attribute rather than promoting it", () => {
    // A card must not invent document structure: the consumer's heading level
    // is theirs to choose, and the adapter has no business rewriting it.
    const { container } = render(
      <Card>
        <h3 slot="header">Third level</h3>
      </Card>,
    )
    const heading = container.querySelector("h3")!
    expect(heading.tagName).toBe("H3")
    expect(heading.getAttribute("slot")).toBe("header")
  })

  it("forwards the ref to the host element", () => {
    const ref = createRef<SkCardElement>()
    render(<Card ref={ref}>Body</Card>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe("SK-CARD")
  })

  it("merges className rather than replacing it", () => {
    const { container } = render(<Card className="custom">Body</Card>)
    expect(container.querySelector("sk-card")!.className).toBe("custom")
  })

  it("renders with no children at all", () => {
    // A card whose slots are all empty is a legal, if pointless, card. It must
    // not throw — the adapter has no required children.
    const { container } = render(<Card />)
    expect(container.querySelector("sk-card")).not.toBeNull()
  })
})
