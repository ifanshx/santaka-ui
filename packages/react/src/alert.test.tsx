import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Alert, type SkAlertElement } from "./alert.js"

/**
 * Alert adapter contract tests.
 *
 * This adapter has no state and no property-name risks, so most assertions
 * pin the ordinary forwarding contract. The variant is asserted as a property
 * because that is the channel a defined element reads, and the stubs set it
 * up to match the upgraded path.
 */
const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-alert") as SkAlertElement
}

describe("Alert adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<Alert>Something happened</Alert>)
    expect(container.querySelector("sk-alert")).not.toBeNull()
  })

  it("passes variant through to the element", () => {
    const element = rendered(<Alert variant="warning">Check your input</Alert>)
    expect(element.variant).toBe("warning")
  })

  it("leaves an unset variant at the element default", () => {
    const element = rendered(<Alert>Done</Alert>)
    expect(element.variant).toBe("neutral")
  })

  it("passes heading through to the element", () => {
    const element = rendered(<Alert heading="Upload failed">Retry?</Alert>)
    expect(element.heading).toBe("Upload failed")
  })

  it("renders children into the element's slot", () => {
    const element = rendered(<Alert heading="Saved">All changes are on disk.</Alert>)
    expect(element.textContent).toContain("All changes are on disk.")
  })

  it("merges className so consumer styles win", () => {
    const element = rendered(<Alert className="my-alert">Hi</Alert>)
    expect(element.getAttribute("class")).toBe("my-alert")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkAlertElement>()
    render(<Alert ref={ref}>Hi</Alert>)
    expect(ref.current?.tagName).toBe("SK-ALERT")
  })
})
