import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Textarea, type SkTextareaElement } from "./textarea.js"

/**
 * Adapter contract tests: prop mapping onto the custom element, the generated
 * id, `className` merge order, the ref, and the change callback. The behavior
 * itself — form participation, native validation, reset — is owned by
 * `@santaka-ui/web-components` and proven in Chromium there.
 */

const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-textarea") as SkTextareaElement
}

describe("Textarea adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<Textarea label="Bio" />)
    expect(container.querySelector("sk-textarea")).not.toBeNull()
    // Not a bare native textarea: the custom element owns the FACE behavior.
    expect(container.querySelector("textarea")).toBeNull()
  })

  it("maps rows and variant", () => {
    const element = rendered(<Textarea rows={8} variant="quiet" />)
    expect(element.rows).toBe(8)
    expect(element.variant).toBe("quiet")
  })

  it("defaults to four rows at the default variant", () => {
    const element = rendered(<Textarea />)
    expect(element.rows).toBe(4)
    expect(element.variant).toBe("default")
  })

  it("maps the labeling props", () => {
    const element = rendered(
      <Textarea label="Notes" description="Markdown" error="Required" invalid required />,
    )
    expect(element.label).toBe("Notes")
    expect(element.description).toBe("Markdown")
    expect(element.error).toBe("Required")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps readOnly, which is what distinguishes it from disabled", () => {
    const readOnly = rendered(<Textarea readOnly />)
    expect(readOnly.readOnly).toBe(true)
    expect(readOnly.disabled).toBe(false)

    expect(rendered(<Textarea disabled />).disabled).toBe(true)
  })

  it("generates a stable id with useId", () => {
    const element = rendered(<Textarea label="Bio" />)
    const id = element.getAttribute("id")
    expect(id).toBeTruthy()
    expect(id).not.toBe("")
  })

  it("prefers an explicit id, which SSR consumers must pass", () => {
    const element = rendered(<Textarea id="server-notes" label="Bio" />)
    expect(element.getAttribute("id")).toBe("server-notes")
  })

  it("keeps the same id across re-renders", () => {
    const { container, rerender } = render(<Textarea label="Bio" />)
    const before = container.querySelector("sk-textarea")!.getAttribute("id")
    rerender(<Textarea label="Renamed" />)
    expect(container.querySelector("sk-textarea")!.getAttribute("id")).toBe(before)
  })

  it("maps the length bounds", () => {
    const element = rendered(<Textarea minLength={5} maxLength={10} />)
    expect(element.minLength).toBe(5)
    expect(element.maxLength).toBe(10)
  })

  it("maps form association props", () => {
    const element = rendered(<Textarea name="notes" form="editor" placeholder="…" />)
    expect(element.getAttribute("name")).toBe("notes")
    expect(element.getAttribute("form")).toBe("editor")
    expect(element.getAttribute("placeholder")).toBe("…")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkTextareaElement>()
    render(<Textarea ref={ref} label="Bio" />)
    expect(ref.current?.tagName).toBe("SK-TEXTAREA")
  })

  it("merges the consumer className", () => {
    expect(rendered(<Textarea className="notes-field" />).getAttribute("class")).toBe("notes-field")
  })

  it("calls onValueChange with the detail value", () => {
    const onValueChange = vi.fn()
    const { container } = render(<Textarea onValueChange={onValueChange} />)
    container
      .querySelector("sk-textarea")!
      .dispatchEvent(new CustomEvent("sk-value-change", { detail: { value: "typed" } }))
    expect(onValueChange).toHaveBeenCalledWith("typed")
  })

  it("leaves onValueChange unset without crashing", () => {
    const { container } = render(<Textarea />)
    const element = container.querySelector("sk-textarea")!
    expect(() =>
      element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { value: "x" } })),
    ).not.toThrow()
  })
})
