import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "./button.js"
import type { SkButtonElement } from "./button.js"

/**
 * These tests cover the React adapter's own contract: the prop mapping onto the
 * custom element, the `className` merge order, and the ref. They deliberately
 * do not assert the component's behavior — that is owned by
 * `@santaka-ui/web-components` and proven in a real browser there.
 *
 * Assertions read *properties*, not attributes: with the stub custom element
 * registered, React 19 assigns props as element properties, which is what a
 * browser does with a defined element.
 */
const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-button") as SkButtonElement
}

describe("Button adapter", () => {
  it("renders the custom element, not a native button", () => {
    const { container } = render(<Button>Save</Button>)
    expect(container.querySelector("sk-button")).not.toBeNull()
    expect(container.querySelector("button")).toBeNull()
  })

  it("passes variant and size through to the element", () => {
    const element = rendered(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    )
    expect(element.variant).toBe("danger")
    expect(element.size).toBe("lg")
  })

  it("leaves an unset prop at the element default", () => {
    const element = rendered(<Button>Save</Button>)
    expect(element.variant).toBe("primary")
    expect(element.size).toBe("md")
    expect(element.disabled).toBe(false)
  })

  it("maps disabled and loading to their ARIA-named props", () => {
    const element = rendered(
      <Button disabled loading>
        Save
      </Button>,
    )
    expect(element.disabled).toBe(true)
    expect(element.loading).toBe(true)
  })

  it("keeps disabled false when explicitly not disabled", () => {
    const element = rendered(<Button disabled={false}>Save</Button>)
    expect(element.disabled).toBe(false)
  })

  it("merges the consumer className so consumer styles win", () => {
    const element = rendered(<Button className="my-button">Save</Button>)
    expect(element.getAttribute("class")).toBe("my-button")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkButtonElement>()
    render(<Button ref={ref}>Save</Button>)
    expect(ref.current?.tagName).toBe("SK-BUTTON")
  })

  it("renders children into the element's slot", () => {
    const element = rendered(<Button>Save changes</Button>)
    expect(element.textContent).toBe("Save changes")
  })

  it("accepts type for form participation", () => {
    const element = rendered(<Button type="submit">Save</Button>)
    expect(element.type).toBe("submit")
  })
})
