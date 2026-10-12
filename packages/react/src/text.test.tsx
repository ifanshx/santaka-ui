import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Text, type SkTextElement } from "./text.js"

/**
 * Text adapter contract tests. The important one is the last: the consumer's
 * element must survive as a direct child, because the component's entire reason
 * to exist is applying a type step *without* taking over the markup.
 */
describe("Text", () => {
  it("renders the custom element with no props set", () => {
    const { container } = render(<Text>Body</Text>)
    const element = container.querySelector("sk-text")!
    // Undefined props must not arrive as the string "undefined", which would
    // put `variant="undefined"` on a reflected attribute and match no CSS rule.
    expect(element.getAttribute("variant")).toBeNull()
    expect(element.getAttribute("family")).toBeNull()
  })

  it("maps variant and family", () => {
    const { container } = render(
      <Text variant="display" family="display">
        <h1>Title</h1>
      </Text>,
    )
    const element = container.querySelector("sk-text") as SkTextElement
    expect(element.variant).toBe("display")
    expect(element.family).toBe("display")
  })

  it("maps muted", () => {
    const { container } = render(<Text muted>Secondary copy</Text>)
    const element = container.querySelector("sk-text") as SkTextElement
    expect(element.muted).toBe(true)
  })

  it("renders the consumer's element as a direct child", () => {
    // No wrapper, no `as` prop: the heading stays a heading, and the outline
    // stays the consumer's. If this ever renders an intermediary element, the
    // component has started owning document structure.
    const { container } = render(
      <Text variant="lg">
        <h2>Section</h2>
      </Text>,
    )
    const element = container.querySelector("sk-text")!
    expect(element.firstElementChild?.tagName).toBe("H2")
    expect(element.querySelector("h2")?.textContent).toBe("Section")
  })

  it("forwards the ref to the host element", () => {
    const ref = createRef<SkTextElement>()
    render(
      <Text ref={ref}>
        <span>Body</span>
      </Text>,
    )
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe("SK-TEXT")
  })

  it("merges className rather than replacing it", () => {
    const { container } = render(
      <Text className="custom">
        <span>Body</span>
      </Text>,
    )
    expect(container.querySelector("sk-text")!.className).toBe("custom")
  })

  it("renders with no children at all", () => {
    const { container } = render(<Text />)
    expect(container.querySelector("sk-text")).not.toBeNull()
  })
})
