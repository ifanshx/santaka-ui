import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Tooltip, TooltipTrigger, type SkTooltipElement } from "./tooltip.js"

/**
 * Tooltip adapter contract tests.
 */
describe("Tooltip", () => {
  it("maps placement and delay", () => {
    const { container } = render(
      <Tooltip placement="bottom" delay={0}>
        <TooltipTrigger>
          <button>Deploy</button>
        </TooltipTrigger>
        Ships the current build.
      </Tooltip>,
    )
    const element = container.querySelector("sk-tooltip") as SkTooltipElement
    expect(element.placement).toBe("bottom")
    expect(element.delay).toBe(0)
    // The description goes in the default slot.
    expect(element.textContent).toContain("Ships the current build.")
  })

  it("renders the trigger into the trigger slot", () => {
    const { container } = render(
      <Tooltip>
        <TooltipTrigger>
          <button>Deploy</button>
        </TooltipTrigger>
      </Tooltip>,
    )
    const element = container.querySelector("sk-tooltip")!
    expect(element.querySelector("[slot='trigger']")).not.toBeNull()
  })

  it("does not export a content part — the description is the children", () => {
    // Unlike Dialog, there is no TooltipContent: a tooltip's description is
    // plain text in the default slot, and a part for it would suggest nesting
    // structure the tooltip does not support.
    const { container } = render(
      <Tooltip>
        <TooltipTrigger>
          <span>X</span>
        </TooltipTrigger>
        Description only
      </Tooltip>,
    )
    expect(container.querySelector("sk-tooltip")!.textContent).toContain("Description only")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkTooltipElement>()
    render(<Tooltip ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-TOOLTIP")
  })

  it("merges className", () => {
    const { container } = render(<Tooltip className="custom" />)
    expect(container.querySelector("sk-tooltip")!.className).toBe("custom")
  })
})
