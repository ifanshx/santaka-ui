import { createRef } from "react"
import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Tab, TabPanel, Tabs, TabsList, type SkTabsElement } from "./tabs.js"

/**
 * Tabs adapter contract tests.
 *
 * The adapter is fully compositional — children, not JSON — so the tests
 * assert structure (slots, parts) and the event bridge, not behavior. Roving
 * tabindex, arrow keys, and ARIA wiring belong to the web component and are
 * covered by its nine Playwright tests.
 */
describe("Tabs", () => {
  function Basic() {
    return (
      <Tabs>
        <TabsList>
          <Tab label="Account" />
          <Tab label="Billing" />
        </TabsList>
        <TabPanel>
          <p>Account settings.</p>
        </TabPanel>
        <TabPanel>
          <p>Billing history.</p>
        </TabPanel>
      </Tabs>
    )
  }

  it("renders the tablist into the tablist slot", () => {
    const { container } = render(<Basic />)
    const list = container.querySelector("sk-tabs > [slot='tablist']")
    expect(list?.tagName).toBe("DIV")
    expect(list?.querySelectorAll("sk-tab")).toHaveLength(2)
  })

  it("passes labels through to the tab parts", () => {
    const { container } = render(<Basic />)
    const labels = [...container.querySelectorAll("sk-tab")].map(
      // React 19 sets a *property* when the stub defines one (see select.test).
      (tab) => (tab as unknown as { label: string }).label,
    )
    expect(labels).toEqual(["Account", "Billing"])
  })

  it("keeps panels as siblings, not nested in the tablist", () => {
    const { container } = render(<Basic />)
    const tabs = container.querySelector("sk-tabs")!
    expect(tabs.querySelectorAll(":scope > sk-tab-panel")).toHaveLength(2)
    expect(tabs.querySelector("[slot='tablist'] sk-tab-panel")).toBeNull()
  })

  it("maps active to the property channel", () => {
    const { container } = render(
      <Tabs active={1}>
        <TabsList>
          <Tab label="A" />
        </TabsList>
      </Tabs>,
    )
    expect((container.querySelector("sk-tabs") as SkTabsElement).active).toBe(1)
  })

  it("delivers onTabChange from the custom event", () => {
    const onTabChange = vi.fn()
    const { container } = render(
      <Tabs onTabChange={onTabChange}>
        <TabsList>
          <Tab label="A" />
        </TabsList>
      </Tabs>,
    )
    const element = container.querySelector("sk-tabs")!
    fireEvent(element, new CustomEvent("sk-tab-change", { detail: { index: 2 } }))
    expect(onTabChange).toHaveBeenCalledWith(2)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkTabsElement>()
    render(<Tabs ref={ref} />)
    expect(ref.current?.tagName).toBe("SK-TABS")
  })

  it("merges className", () => {
    const { container } = render(<Tabs className="custom" />)
    expect(container.querySelector("sk-tabs")!.className).toBe("custom")
  })
})
