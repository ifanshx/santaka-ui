import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EmptyState, type SkEmptyStateElement } from "./empty-state.js"

/**
 * EmptyState adapter contract tests.
 *
 * Beyond the ordinary forwarding contract, one assertion pins the named-slot
 * path: a child carrying `slot="actions"` must survive render as a light-DOM
 * child of the element, because the browser's slot assignment — not the
 * adapter — is what places it.
 */
const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-empty-state") as SkEmptyStateElement
}

describe("EmptyState adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<EmptyState heading="Nothing here" />)
    expect(container.querySelector("sk-empty-state")).not.toBeNull()
  })

  it("passes variant and size through to the element", () => {
    const element = rendered(<EmptyState variant="bare" size="sm" heading="Empty" />)
    expect(element.variant).toBe("bare")
    expect(element.size).toBe("sm")
  })

  it("leaves unset props at the element defaults", () => {
    const element = rendered(<EmptyState heading="Empty" />)
    expect(element.variant).toBe("default")
    expect(element.size).toBe("md")
  })

  it("passes heading and description through", () => {
    const element = rendered(
      <EmptyState heading="No results" description="Try a different filter." />,
    )
    expect(element.heading).toBe("No results")
    expect(element.description).toBe("Try a different filter.")
  })

  it("renders children into the element's default slot", () => {
    const element = rendered(
      <EmptyState heading="No results">
        <p>Clear the filters to see everything.</p>
      </EmptyState>,
    )
    expect(element.querySelector("p")?.textContent).toBe("Clear the filters to see everything.")
  })

  it("keeps slotted children in the light DOM for the browser to assign", () => {
    const element = rendered(
      <EmptyState heading="No results">
        <button slot="actions" type="button">
          Clear filters
        </button>
      </EmptyState>,
    )
    // Adapter contract, not slot behavior: the child must still be a direct
    // light-DOM child carrying its slot attribute, or the browser could never
    // assign it.
    const action = element.querySelector('[slot="actions"]')
    expect(action?.tagName).toBe("BUTTON")
  })

  it("merges className", () => {
    const element = rendered(<EmptyState className="my-empty" heading="Empty" />)
    expect(element.getAttribute("class")).toBe("my-empty")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkEmptyStateElement>()
    render(<EmptyState ref={ref} heading="Empty" />)
    expect(ref.current?.tagName).toBe("SK-EMPTY-STATE")
  })
})
