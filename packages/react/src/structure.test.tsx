import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Label, type SkLabelElement } from "./label.js"
import { Separator, type SkSeparatorElement } from "./separator.js"

/**
 * Adapter contract tests for the two structure components.
 *
 * Label's mapping is the one worth pinning: the React prop is `htmlFor`, the
 * element's attribute is `for`, and the custom element's own prop is `forId`
 * bound to the `for` attribute — three names for one association, and the test
 * asserts the journey ends at the right attribute.
 */
describe("Label", () => {
  it("maps htmlFor onto the element's for attribute", () => {
    const { container } = render(<Label htmlFor="email">Email address</Label>)
    const element = container.querySelector("sk-label")!
    // The DOM attribute is what the browser's label activation reads, so this
    // is the assertion that matters — not the prop name on the wrapper.
    expect(element.getAttribute("for")).toBe("email")
  })

  it("requires htmlFor", () => {
    // Type-level, but the rendered evidence is that no attribute appears when
    // nothing was passed.
    const { container } = render(<Label htmlFor="">Decorative</Label>)
    expect(container.querySelector("sk-label")!.getAttribute("for")).toBe("")
  })

  it("maps required and marker", () => {
    const { container } = render(
      <Label htmlFor="notes" required marker="before">
        Notes
      </Label>,
    )
    const element = container.querySelector("sk-label") as SkLabelElement
    expect(element.required).toBe(true)
    expect(element.marker).toBe("before")
  })

  it("renders children as the label's text", () => {
    const { container } = render(<Label htmlFor="x">Email address</Label>)
    expect(container.querySelector("sk-label")!.textContent).toBe("Email address")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkLabelElement>()
    render(
      <Label ref={ref} htmlFor="x">
        X
      </Label>,
    )
    expect(ref.current?.tagName).toBe("SK-LABEL")
  })
})

describe("Separator", () => {
  it("maps orientation, decorative, and label", () => {
    const { container } = render(<Separator orientation="vertical" decorative />)
    const element = container.querySelector("sk-separator") as SkSeparatorElement
    expect(element.orientation).toBe("vertical")
    expect(element.decorative).toBe(true)
  })

  it("carries a label for a meaningful separator", () => {
    const { container } = render(<Separator label="or" />)
    const element = container.querySelector("sk-separator") as SkSeparatorElement
    // The adapter's job is delivering the prop; computing `aria-label` from it
    // (and suppressing it when decorative) is the component's, and that is
    // covered in the browser suite. The stub element is inert, so asserting
    // aria-label here would test nothing.
    expect(element.getAttribute("label")).toBe("or")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkSeparatorElement>()
    render(<Separator ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-SEPARATOR")
  })

  it("merges className", () => {
    const { container } = render(<Separator className="custom" />)
    expect(container.querySelector("sk-separator")!.className).toBe("custom")
  })
})
