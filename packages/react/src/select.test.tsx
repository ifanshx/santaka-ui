import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Select, type SkSelectElement } from "./select.js"

/**
 * Select adapter contract tests.
 */
describe("Select", () => {
  const OPTIONS = [
    { value: "production", label: "Production" },
    { value: "staging", label: "Staging" },
  ]

  it("serializes options to JSON for the attribute", () => {
    const { container } = render(<Select options={OPTIONS} />)
    const element = container.querySelector("sk-select")!
    // React 19 sets a *property* when the element defines one, and falls back
    // to the attribute otherwise. The stub defines an `options` property, so
    // the delivery is read there; the element parses whatever it receives once
    // on upgrade.
    const received = (element as HTMLElement & { options: unknown }).options
    expect(JSON.parse(String(received))).toEqual(OPTIONS)
  })

  it("maps the field props", () => {
    const { container } = render(
      <Select
        options={OPTIONS}
        label="Environment"
        description="Where it deploys."
        error="Required."
        invalid
        disabled
        required
        placeholder="Choose"
      />,
    )
    const element = container.querySelector("sk-select") as SkSelectElement
    expect(element.label).toBe("Environment")
    expect(element.description).toBe("Where it deploys.")
    expect(element.error).toBe("Required.")
    expect(element.invalid).toBe(true)
    expect(element.disabled).toBe(true)
    expect(element.required).toBe(true)
    expect(element.placeholder).toBe("Choose")
  })

  it("maps value and defaultValue to their channels", () => {
    const { container } = render(
      <Select options={OPTIONS} value="staging" defaultValue="production" />,
    )
    const element = container.querySelector("sk-select") as HTMLElement & {
      value: string
    }
    // `value` is a defined property on the stub, so React wrote the property;
    // `default-value` has no property, so it arrived as the attribute.
    expect(element.value).toBe("staging")
    expect(element.getAttribute("default-value")).toBe("production")
  })

  it("delivers onValueChange from the custom event", () => {
    const onValueChange = vi.fn()
    const { container } = render(<Select options={OPTIONS} onValueChange={onValueChange} />)
    const element = container.querySelector("sk-select")!
    element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { value: "staging" } }))
    expect(onValueChange).toHaveBeenCalledWith("staging")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkSelectElement>()
    render(<Select ref={ref} options={OPTIONS} />)
    expect(ref.current?.tagName).toBe("SK-SELECT")
  })

  it("merges className", () => {
    const { container } = render(<Select className="custom" />)
    expect(container.querySelector("sk-select")!.className).toBe("custom")
  })
})
