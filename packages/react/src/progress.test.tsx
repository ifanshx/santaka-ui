import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Progress, type SkProgressElement } from "./progress.js"

/**
 * Progress adapter contract tests.
 *
 * The risk this adapter carries is numeric, not boolean: `max` must land as
 * the number 50, not the string "50", and `value` must be absent — not
 * stringified — when the bar is indeterminate. Both assertions run against
 * the property channel, which is what a defined element reads.
 */
const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-progress") as SkProgressElement
}

describe("Progress adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<Progress value={40} />)
    expect(container.querySelector("sk-progress")).not.toBeNull()
  })

  it("passes value as a number", () => {
    const element = rendered(<Progress value={40} />)
    expect(element.value).toBe(40)
  })

  it("passes max as a number, not an attribute string", () => {
    const element = rendered(<Progress value={25} max={50} />)
    // Strict equality is the point: "25"/"50" stringification would fail.
    expect(element.max).toBe(50)
    expect(element.value).toBe(25)
  })

  it("leaves value absent for the indeterminate sweep", () => {
    const element = rendered(<Progress />)
    expect(element.value).toBeUndefined()
    expect(element.max).toBe(100)
  })

  it("passes label and size through", () => {
    const element = rendered(<Progress label="Uploading" size="lg" value={10} />)
    expect(element.label).toBe("Uploading")
    expect(element.size).toBe("lg")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkProgressElement>()
    render(<Progress ref={ref} value={1} />)
    expect(ref.current?.tagName).toBe("SK-PROGRESS")
  })

  it("merges className", () => {
    const element = rendered(<Progress className="my-bar" value={5} />)
    expect(element.getAttribute("class")).toBe("my-bar")
  })
})
