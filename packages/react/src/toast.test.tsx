import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Toast, type SkToastElement } from "./toast.js"

/**
 * Toast adapter contract tests.
 */
describe("Toast", () => {
  it("maps open, duration, and variant", () => {
    const { container } = render(
      <Toast open duration={0} variant="danger">
        Deployment failed.
      </Toast>,
    )
    const element = container.querySelector("sk-toast") as SkToastElement
    expect(element.open).toBe(true)
    expect(element.duration).toBe(0)
    expect(element.variant).toBe("danger")
    // The message goes in the default slot — the panel's role=status announces it.
    expect(element.textContent).toBe("Deployment failed.")
  })

  it("delivers onDismiss only when closing", () => {
    const onDismiss = vi.fn()
    const { container } = render(<Toast onDismiss={onDismiss} />)
    const element = container.querySelector("sk-toast")!
    element.dispatchEvent(new CustomEvent("sk-open-change", { detail: { open: true } }))
    expect(onDismiss).not.toHaveBeenCalled()
    element.dispatchEvent(new CustomEvent("sk-open-change", { detail: { open: false } }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkToastElement>()
    render(<Toast ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-TOAST")
  })

  it("merges className", () => {
    const { container } = render(<Toast className="custom" />)
    expect(container.querySelector("sk-toast")!.className).toBe("custom")
  })

  it("renders with no children", () => {
    const { container } = render(<Toast />)
    expect(container.querySelector("sk-toast")).not.toBeNull()
  })
})
