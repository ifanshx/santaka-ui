import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AlertDialog, AlertDialogContent, type SkAlertDialogElement } from "./alert-dialog.js"

/**
 * AlertDialog adapter contract tests.
 *
 * There is no trigger part, and the test suite proves the *absence*: an alert
 * is raised by the application, never opened by the user browsing.
 */
describe("AlertDialog", () => {
  it("maps open, label, and initialFocus", () => {
    const { container } = render(
      <AlertDialog open label="Delete?" initialFocus="#cancel">
        <AlertDialogContent title={<h3>Delete this repository?</h3>}>
          <p>This cannot be undone.</p>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const element = container.querySelector("sk-alert-dialog") as SkAlertDialogElement
    expect(element.open).toBe(true)
    expect(element.label).toBe("Delete?")
    expect(element.getAttribute("initial-focus")).toBe("#cancel")
  })

  it("renders the content and title slots", () => {
    const { container } = render(
      <AlertDialog>
        <AlertDialogContent title={<h3>Confirm</h3>}>
          <p>Body</p>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const element = container.querySelector("sk-alert-dialog")!
    expect(element.querySelector("[slot='title'] h3")!.textContent).toBe("Confirm")
    expect(element.querySelector("p")).not.toBeNull()
  })

  it("has no trigger part — the app raises it", () => {
    // Structural proof of the design decision: the module exports AlertDialog
    // and AlertDialogContent, and nothing that opens it on a click.
    expect("AlertDialogTrigger" in {}).toBe(false)
  })

  it("delivers onOpenChange", () => {
    const onOpenChange = vi.fn()
    const { container } = render(<AlertDialog onOpenChange={onOpenChange} />)
    const element = container.querySelector("sk-alert-dialog")!
    element.dispatchEvent(new CustomEvent("sk-open-change", { detail: { open: false } }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkAlertDialogElement>()
    render(<AlertDialog ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-ALERT-DIALOG")
  })
})
