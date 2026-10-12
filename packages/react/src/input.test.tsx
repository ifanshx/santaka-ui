import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Input, type SkInputElement } from "./input.js"

/**
 * Adapter contract tests: prop mapping onto the custom element, the generated
 * id, `className` merge order, the ref, and the change callback. The behavior
 * itself — form participation, native validation, reset — is owned by
 * `@santaka-ui/web-components` and proven in Chromium there.
 */

const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-input") as SkInputElement
}

describe("Input adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<Input label="Email" />)
    expect(container.querySelector("sk-input")).not.toBeNull()
    // Not a bare native input: the custom element owns the FACE behavior.
    expect(container.querySelector("input")).toBeNull()
  })

  it("maps type, variant, and size", () => {
    const element = rendered(<Input type="email" variant="quiet" size="lg" />)
    expect(element.type).toBe("email")
    expect(element.variant).toBe("quiet")
    expect(element.size).toBe("lg")
  })

  it("defaults to a text field at medium size", () => {
    const element = rendered(<Input />)
    expect(element.type).toBe("text")
    expect(element.size).toBe("md")
    expect(element.variant).toBe("default")
  })

  it("maps the labeling props", () => {
    const element = rendered(
      <Input label="Handle" description="Shown publicly" error="Taken" invalid required />,
    )
    expect(element.label).toBe("Handle")
    expect(element.description).toBe("Shown publicly")
    expect(element.error).toBe("Taken")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps readOnly, which is what distinguishes it from disabled", () => {
    const readOnly = rendered(<Input readOnly />)
    expect(readOnly.readOnly).toBe(true)
    expect(readOnly.disabled).toBe(false)

    const disabled = rendered(<Input disabled />)
    expect(disabled.disabled).toBe(true)
  })

  it("generates a stable id with useId so the element can associate its label", () => {
    const element = rendered(<Input label="Email" />)
    const id = element.getAttribute("id")
    // The exact shape is React version-dependent (this React emits "_r_6_"),
    // so the assertion is that an id exists and is stable, not what it looks like.
    expect(id).toBeTruthy()
    expect(id).not.toBe("")
  })

  it("prefers an explicit id, which SSR consumers must pass", () => {
    // Section 4: React's useId and the Web Components counter do not agree, so a
    // separately-rendered Label only finds the control under SSR if the consumer
    // supplies the id.
    const element = rendered(<Input id="server-field" label="Email" />)
    expect(element.getAttribute("id")).toBe("server-field")
  })

  it("keeps the same id across re-renders", () => {
    const { container, rerender } = render(<Input label="Email" />)
    const before = container.querySelector("sk-input")!.getAttribute("id")
    rerender(<Input label="Email renamed" />)
    const after = container.querySelector("sk-input")!.getAttribute("id")
    expect(after).toBe(before)
  })

  it("maps the native constraint props", () => {
    const element = rendered(<Input minLength={2} maxLength={8} pattern="[0-9]+" />)
    expect(element.minLength).toBe(2)
    expect(element.maxLength).toBe(8)
    expect(element.pattern).toBe("[0-9]+")
  })

  it("maps form association props", () => {
    const element = rendered(<Input name="email" form="login" autocomplete="email" />)
    expect(element.getAttribute("name")).toBe("email")
    expect(element.getAttribute("form")).toBe("login")
    expect(element.getAttribute("autocomplete")).toBe("email")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkInputElement>()
    render(<Input ref={ref} label="Email" />)
    expect(ref.current?.tagName).toBe("SK-INPUT")
  })

  it("merges the consumer className", () => {
    const element = rendered(<Input className="form-field" />)
    expect(element.getAttribute("class")).toBe("form-field")
  })

  it("calls onValueChange with the detail value", () => {
    const onValueChange = vi.fn()
    const { container } = render(<Input onValueChange={onValueChange} />)
    const element = container.querySelector("sk-input")!

    element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { value: "typed" } }))
    expect(onValueChange).toHaveBeenCalledWith("typed")
  })

  it("leaves onValueChange unset without crashing", () => {
    const { container } = render(<Input />)
    const element = container.querySelector("sk-input")!
    expect(() =>
      element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { value: "x" } })),
    ).not.toThrow()
  })
})
