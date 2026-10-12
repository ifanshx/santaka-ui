import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Spinner, type SkSpinnerElement } from "./spinner.js"
import { Skeleton, type SkSkeletonElement } from "./skeleton.js"

/**
 * Adapter contract tests for the two waiting components.
 *
 * The interesting assertions are the negative ones: Skeleton must not accept
 * children (it is scaffolding that content replaces), and Spinner's label must
 * reach the element so the default never silently swallows a custom one.
 */
describe("Spinner", () => {
  it("renders the custom element with the honest default label", () => {
    const { container } = render(<Spinner />)
    const element = container.querySelector("sk-spinner") as SkSpinnerElement
    // The component supplies "Loading"; the adapter passing undefined must not
    // overwrite it with the string "undefined".
    expect(element.getAttribute("label")).toBeNull()
    expect(element.tagName).toBe("SK-SPINNER")
  })

  it("maps size, label, and status", () => {
    const { container } = render(<Spinner size="lg" label="Uploading" status="60%" />)
    const element = container.querySelector("sk-spinner") as SkSpinnerElement
    expect(element.size).toBe("lg")
    expect(element.label).toBe("Uploading")
    expect(element.status).toBe("60%")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkSpinnerElement>()
    render(<Spinner ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-SPINNER")
  })

  it("merges className", () => {
    const { container } = render(<Spinner className="custom" />)
    expect(container.querySelector("sk-spinner")!.className).toBe("custom")
  })
})

describe("Skeleton", () => {
  it("maps variant and direction", () => {
    const { container } = render(<Skeleton variant="circle" direction="rtl" />)
    const element = container.querySelector("sk-skeleton") as SkSkeletonElement
    expect(element.variant).toBe("circle")
    expect(element.direction).toBe("rtl")
  })

  it("accepts no children — scaffolding is replaced, not filled", () => {
    // The component renders no slot. If children were silently accepted and
    // dropped, a consumer would lose markup; the type makes it a compile error
    // instead, and this test documents the intent.
    const { container } = render(<Skeleton />)
    const element = container.querySelector("sk-skeleton")!
    expect(element.childElementCount).toBe(0)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkSkeletonElement>()
    render(<Skeleton ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-SKELETON")
  })

  it("merges className", () => {
    const { container } = render(<Skeleton className="custom" />)
    expect(container.querySelector("sk-skeleton")!.className).toBe("custom")
  })
})
