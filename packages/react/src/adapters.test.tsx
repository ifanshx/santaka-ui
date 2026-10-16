import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { IconButton, type SkIconButtonElement } from "./icon-button.js"
import { Link, type SkLinkElement } from "./link.js"
import { Badge, type SkBadgeElement } from "./badge.js"
/**
 * Adapter contract tests: prop mapping, `className` merge, and ref forwarding.
 * Behavior is owned by the custom element and proven in Chromium there.
 */

const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container
}

describe("IconButton adapter", () => {
  it("renders the custom element, not a native button", () => {
    const container = rendered(
      <IconButton label="Add">
        <svg />
      </IconButton>,
    )
    expect(container.querySelector("sk-icon-button")).not.toBeNull()
    expect(container.querySelector("button")).toBeNull()
  })

  it("passes label through as the accessible name", () => {
    const container = rendered(
      <IconButton label="Delete item">
        <svg />
      </IconButton>,
    )
    // Read the property, not the attribute: React 19 assigns props on a defined
    // custom element, and the upstream component copies `label` to
    // `aria-label` during render rather than reflecting it.
    const element = container.querySelector("sk-icon-button") as SkIconButtonElement
    expect(element.label).toBe("Delete item")
  })

  it("defaults to the ghost variant", () => {
    const container = rendered(
      <IconButton label="Add">
        <svg />
      </IconButton>,
    )
    expect((container.querySelector("sk-icon-button") as SkIconButtonElement).variant).toBe("ghost")
  })

  it("maps disabled and loading", () => {
    const container = rendered(
      <IconButton label="Add" disabled loading>
        <svg />
      </IconButton>,
    )
    const element = container.querySelector("sk-icon-button") as SkIconButtonElement
    expect(element.disabled).toBe(true)
    expect(element.loading).toBe(true)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkIconButtonElement>()
    render(
      <IconButton ref={ref} label="Add">
        <svg />
      </IconButton>,
    )
    expect(ref.current?.tagName).toBe("SK-ICON-BUTTON")
  })

  it("merges the consumer className", () => {
    const container = rendered(
      <IconButton label="Add" className="toolbar-button">
        <svg />
      </IconButton>,
    )
    expect(container.querySelector("sk-icon-button")!.getAttribute("class")).toBe("toolbar-button")
  })

  it("forwards id to the element", () => {
    const container = rendered(
      <IconButton label="Add" id="add-row">
        <svg />
      </IconButton>,
    )
    expect(container.querySelector("sk-icon-button")!.id).toBe("add-row")
  })

  it("wires onClick as a listener on the element", () => {
    let clicks = 0
    const container = rendered(
      <IconButton label="Add" onClick={() => clicks++}>
        <svg />
      </IconButton>,
    )
    container
      .querySelector("sk-icon-button")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(clicks).toBe(1)
  })
})

describe("Link adapter", () => {
  it("renders the custom element", () => {
    const container = rendered(<Link href="/docs">Docs</Link>)
    expect(container.querySelector("sk-link")).not.toBeNull()
  })

  it("passes href through", () => {
    const container = rendered(<Link href="/docs">Docs</Link>)
    const element = container.querySelector("sk-link") as SkLinkElement
    expect(element.href).toBe("/docs")
  })

  it("maps external and subtle", () => {
    const container = rendered(
      <Link href="https://example.com" external subtle>
        Example
      </Link>,
    )
    const element = container.querySelector("sk-link") as SkLinkElement
    expect(element.external).toBe(true)
    expect(element.subtle).toBe(true)
  })

  it("leaves external off by default", () => {
    const container = rendered(<Link href="/docs">Docs</Link>)
    expect((container.querySelector("sk-link") as SkLinkElement).external).toBe(false)
  })

  it("forwards the ref", () => {
    const ref = createRef<SkLinkElement>()
    render(
      <Link ref={ref} href="/docs">
        Docs
      </Link>,
    )
    expect(ref.current?.tagName).toBe("SK-LINK")
  })

  it("merges the consumer className", () => {
    const container = rendered(
      <Link href="/docs" className="nav-link">
        Docs
      </Link>,
    )
    expect(container.querySelector("sk-link")!.getAttribute("class")).toBe("nav-link")
  })

  it("renders children as the anchor's text", () => {
    const container = rendered(<Link href="/docs">Read the docs</Link>)
    expect(container.querySelector("sk-link")!.textContent).toBe("Read the docs")
  })
})

describe("Badge adapter", () => {
  it("renders the custom element", () => {
    const container = rendered(<Badge variant="success">Active</Badge>)
    const element = container.querySelector("sk-badge")
    expect(element).not.toBeNull()
    expect(element!.textContent).toBe("Active")
  })

  it("maps variant and size through to the element", () => {
    const container = rendered(
      <Badge variant="danger" size="sm">
        Failed
      </Badge>,
    )
    const element = container.querySelector("sk-badge") as SkBadgeElement
    expect(element.variant).toBe("danger")
    expect(element.size).toBe("sm")
  })

  it("defaults to the neutral variant, because a badge with no emphasis is the common case", () => {
    const container = rendered(<Badge>Draft</Badge>)
    expect((container.querySelector("sk-badge") as SkBadgeElement).variant).toBe("neutral")
  })

  it("passes statusLabel through for the dot variant", () => {
    // The dot conveys state by color alone, which WCAG 1.4.1 forbids, so the
    // label is what makes it announced. The adapter's job is to carry it; the
    // element renders it visually hidden.
    const container = rendered(<Badge dot statusLabel="Active" />)
    const element = container.querySelector("sk-badge") as SkBadgeElement
    expect(element.dot).toBe(true)
    expect(element.statusLabel).toBe("Active")
  })

  it("forwards the ref", () => {
    const ref = createRef<SkBadgeElement>()
    render(<Badge ref={ref}>Active</Badge>)
    expect(ref.current?.tagName).toBe("SK-BADGE")
  })

  it("merges the consumer className", () => {
    const container = rendered(<Badge className="status-chip">Active</Badge>)
    expect(container.querySelector("sk-badge")!.getAttribute("class")).toBe("status-chip")
  })
})
