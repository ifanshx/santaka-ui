import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Table, type SkTableElement } from "./table.js"

/**
 * Table adapter contract tests.
 *
 * `striped` is the boolean-prop risk: as an attribute string "false" would
 * convert to truthy on an upgraded element. The test pins the property
 * channel by strict equality, which is what React 19 uses when the defined
 * element declares the property — the same way the Switch stub reflects it.
 */
const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-table") as SkTableElement
}

describe("Table adapter", () => {
  it("renders the custom element, keeping the consumer's real table as a child", () => {
    const { container } = render(
      <Table>
        <table>
          <caption>Team members</caption>
          <tbody>
            <tr>
              <td>Ada</td>
            </tr>
          </tbody>
        </table>
      </Table>,
    )
    expect(container.querySelector("sk-table")).not.toBeNull()
    // Still the consumer's own markup, one slot below the host.
    expect(container.querySelector("sk-table > table")?.tagName).toBe("TABLE")
    expect(container.querySelector("sk-table caption")?.textContent).toBe("Team members")
  })

  it("passes variant and density through to the element", () => {
    const element = rendered(<Table variant="plain" density="compact" />)
    expect(element.variant).toBe("plain")
    expect(element.density).toBe("compact")
  })

  it("leaves unset props at the element defaults", () => {
    const element = rendered(<Table />)
    expect(element.variant).toBe("default")
    expect(element.density).toBe("default")
    expect(element.striped).toBe(false)
  })

  it('maps striped to a boolean property, not the string "false"', () => {
    // Strict equality is the assertion: `striped === "false"` — a truthy
    // string — would light zebra rows on a table that asked for none.
    expect(rendered(<Table striped={false} />).striped).toBe(false)
    expect(rendered(<Table striped />).striped).toBe(true)
  })

  it("passes label through to the element", () => {
    const element = rendered(<Table label="Team members" />)
    expect(element.label).toBe("Team members")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkTableElement>()
    render(<Table ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-TABLE")
  })

  it("merges className", () => {
    const element = rendered(<Table className="my-table" />)
    expect(element.getAttribute("class")).toBe("my-table")
  })
})
