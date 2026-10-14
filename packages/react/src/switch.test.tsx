import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Switch, type SkSwitchElement } from "./switch.js"

/**
 * Adapter contract tests: prop mapping onto the custom element, the generated
 * id, `className` merge order, the ref, and the change callback. The behavior
 * itself — FACE, native validation, the role=switch reading — is owned by
 * `@santaka-ui/web-components` and proven in Chromium there.
 */

const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-switch") as SkSwitchElement
}

describe("Switch adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<Switch label="Dark mode" />)
    expect(container.querySelector("sk-switch")).not.toBeNull()
    // Not a bare native input: the custom element owns the FACE behavior.
    expect(container.querySelector("input")).toBeNull()
  })

  it("maps variant and size", () => {
    const element = rendered(<Switch label="Quiet" variant="quiet" size="lg" />)
    expect(element.variant).toBe("quiet")
    expect(element.size).toBe("lg")
  })

  it("defaults to medium size and default variant", () => {
    const element = rendered(<Switch label="Dark mode" />)
    expect(element.size).toBe("md")
    expect(element.variant).toBe("default")
  })

  it("maps the labeling props", () => {
    const element = rendered(
      <Switch label="Sync" description="Background sync" error="Unavailable" invalid required />,
    )
    expect(element.label).toBe("Sync")
    expect(element.description).toBe("Background sync")
    expect(element.error).toBe("Unavailable")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps checked as the ARIA-mirroring boolean, not isOn", () => {
    const on = rendered(<Switch label="Dark mode" checked />)
    expect(on.checked).toBe(true)

    const off = rendered(<Switch label="Dark mode" />)
    expect(off.checked).toBe(false)
  })

  it("maps defaultChecked for the uncontrolled case", () => {
    const element = rendered(<Switch label="Dark mode" defaultChecked />)
    expect(element.defaultChecked).toBe(true)
  })

  it("maps disabled and form", () => {
    const element = rendered(<Switch label="Dark mode" disabled form="settings" />)
    expect(element.disabled).toBe(true)
    expect(element.form).toBe("settings")
  })

  it("generates a stable id with useId so the element can associate its label", () => {
    const element = rendered(<Switch label="Dark mode" />)
    const id = element.getAttribute("id")
    // The exact shape is React version-dependent (this React emits "_r_6_"),
    // so the assertion is that an id exists and is non-empty, not what it looks like.
    expect(id).toBeTruthy()
    expect(id).not.toBe("")
  })

  it("passes an explicit id through", () => {
    const element = rendered(<Switch label="Dark mode" id="dark-toggle" />)
    expect(element.getAttribute("id")).toBe("dark-toggle")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkSwitchElement>()
    render(<Switch label="Dark mode" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName.toLowerCase()).toBe("sk-switch")
  })

  it("merges className last so consumer styles win", () => {
    const element = rendered(<Switch label="Dark mode" className="consumer-class" />)
    expect(element.getAttribute("class")).toBe("consumer-class")
  })

  it("wires onValueChange to sk-value-change", async () => {
    const onValueChange = vi.fn()
    const { container } = render(<Switch label="Dark mode" onValueChange={onValueChange} />)
    const element = container.querySelector("sk-switch") as HTMLElement & {
      onValueChange?: unknown
    }
    // The adapter listens for the native sk-value-change CustomEvent.
    element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { checked: true }, bubbles: true }),
    )
    await Promise.resolve()
    expect(onValueChange).toHaveBeenCalledWith(true)
  })
})
