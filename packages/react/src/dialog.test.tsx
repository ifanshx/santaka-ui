import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Dialog, DialogContent, DialogTrigger, type SkDialogElement } from "./dialog.js"

/**
 * Dialog adapter contract tests.
 *
 * The interesting one is the event: `sk-open-change` is subscribed
 * imperatively because React's synthetic system does not know custom event
 * names — the test proves the subscription works by dispatching the event the
 * web component would dispatch, not by re-testing the component.
 */
describe("Dialog", () => {
  it("renders the custom element with the compound parts slotted", () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent title="Discard draft?">
          <p>Your draft will be deleted.</p>
        </DialogContent>
      </Dialog>,
    )
    const element = container.querySelector("sk-dialog")!
    expect(element.querySelector("[slot='trigger']")).not.toBeNull()
    expect(element.querySelector("[slot='title']")).not.toBeNull()
    // Content that is not slotted lands in the panel's default slot.
    expect(element.querySelector("p")).not.toBeNull()
  })

  it("maps the props", () => {
    const { container } = render(<Dialog open modal={false} dismissible label="Confirm" />)
    const element = container.querySelector("sk-dialog") as SkDialogElement
    expect(element.open).toBe(true)
    expect(element.modal).toBe(false)
    expect(element.dismissible).toBe(true)
    expect(element.label).toBe("Confirm")
  })

  it("delivers onOpenChange from the custom event", () => {
    const onOpenChange = vi.fn()
    const { container } = render(<Dialog onOpenChange={onOpenChange} />)
    const element = container.querySelector("sk-dialog")!
    // The web component dispatches this event; the adapter's imperative
    // listener must hand it to the callback.
    element.dispatchEvent(new CustomEvent("sk-open-change", { detail: { open: true } }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkDialogElement>()
    render(<Dialog ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-DIALOG")
  })

  it("merges className", () => {
    const { container } = render(<Dialog className="custom" />)
    expect(container.querySelector("sk-dialog")!.className).toBe("custom")
  })

  it("DialogContent renders the title into the title slot", () => {
    const { container } = render(<DialogContent title={<h3>Hi</h3>} />)
    expect(container.querySelector("[slot='title'] h3")!.textContent).toBe("Hi")
  })
})
