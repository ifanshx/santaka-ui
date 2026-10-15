import { h, type Component } from "vue"
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { IconButton, type SkIconButtonElement } from "./icon-button.js"
import { Link, type SkLinkElement } from "./link.js"
import { Badge, type SkBadgeElement } from "./badge.js"

/**
 * Adapter contract tests: prop mapping, the class merge, and the ref.
 * Behavior is owned by the custom element and proven in Chromium there.
 *
 * The ref is read through a function ref on a component vnode, which receives
 * the *exposed* object — the same value a consumer's `ref="x"` resolves to.
 * Reading `wrapper.vm.$el` instead would pass even if `elementProxy` were
 * deleted, because Vue's own instance exposes `$el` regardless, so it would not
 * test the contract this file is about.
 */
const rendered = (component: Component, props: Record<string, unknown> = {}) =>
  mount(component, { props }).element as HTMLElement

function exposedRef(component: Component, props: Record<string, unknown> = {}): unknown {
  let exposed: unknown
  mount({
    setup: () => () => h(component, { ...props, ref: (value: unknown) => (exposed = value) }),
  })
  return exposed
}

describe("IconButton adapter", () => {
  it("renders the custom element, not a native button", () => {
    const wrapper = mount(IconButton, { props: { label: "Add" } })
    expect(wrapper.element.tagName).toBe("SK-ICON-BUTTON")
    expect(wrapper.find("button").exists()).toBe(false)
  })

  it("maps variant and size", () => {
    const element = rendered(IconButton, { label: "Add", variant: "danger", size: "lg" })
    expect((element as SkIconButtonElement).variant).toBe("danger")
    expect((element as SkIconButtonElement).size).toBe("lg")
  })

  it("defaults to ghost at medium size", () => {
    const element = rendered(IconButton, { label: "Add" }) as SkIconButtonElement
    expect(element.variant).toBe("ghost")
    expect(element.size).toBe("md")
  })

  it("maps disabled and loading", () => {
    const element = rendered(IconButton, { label: "Add", disabled: true, loading: true })
    expect((element as SkIconButtonElement).disabled).toBe(true)
    expect((element as SkIconButtonElement).loading).toBe(true)
  })

  it("carries the required accessible name", () => {
    // The label is what makes the icon announced; there is no visible text.
    const element = rendered(IconButton, { label: "Close" }) as SkIconButtonElement
    expect(element.label).toBe("Close")
  })

  it("resolves the ref to the custom element", () => {
    const ref = exposedRef(IconButton, { label: "Add" })
    expect((ref as HTMLElement).tagName).toBe("SK-ICON-BUTTON")
    expect(ref).toBeInstanceOf(HTMLElement)
  })

  it("merges the consumer class so consumer styles win", () => {
    const wrapper = mount(IconButton, { props: { label: "Add" }, attrs: { class: "toolbar-icon" } })
    expect(wrapper.element.getAttribute("class")).toBe("toolbar-icon")
  })
})

describe("Link adapter", () => {
  it("renders the custom element, not a native anchor", () => {
    const wrapper = mount(Link, { props: { href: "/docs" }, slots: { default: "Docs" } })
    expect(wrapper.element.tagName).toBe("SK-LINK")
    expect(wrapper.find("a").exists()).toBe(false)
  })

  it("maps href and the external treatment", () => {
    const element = rendered(Link, { href: "https://example.com", external: true }) as SkLinkElement
    expect(element.href).toBe("https://example.com")
    expect(element.external).toBe(true)
  })

  it("leaves external and subtle unset by default", () => {
    const element = rendered(Link, { href: "/docs" }) as SkLinkElement
    expect(element.external).toBe(false)
    expect(element.subtle).toBe(false)
  })

  it("maps target, rel, and download", () => {
    const element = rendered(Link, {
      href: "/report.pdf",
      target: "_blank",
      rel: "noopener",
      download: "report.pdf",
    }) as SkLinkElement
    expect(element.target).toBe("_blank")
    expect(element.rel).toBe("noopener")
    expect(element.download).toBe("report.pdf")
  })

  it("renders children into the element's slot", () => {
    const wrapper = mount(Link, { props: { href: "/docs" }, slots: { default: "Read the docs" } })
    expect(wrapper.text()).toBe("Read the docs")
  })

  it("resolves the ref to the custom element", () => {
    const ref = exposedRef(Link, { href: "/docs" })
    expect((ref as HTMLElement).tagName).toBe("SK-LINK")
  })

  it("merges the consumer class", () => {
    const wrapper = mount(Link, { props: { href: "/docs" }, attrs: { class: "inline-link" } })
    expect(wrapper.element.getAttribute("class")).toBe("inline-link")
  })
})

describe("Badge adapter", () => {
  it("renders the custom element", () => {
    const wrapper = mount(Badge, { slots: { default: "New" } })
    expect(wrapper.element.tagName).toBe("SK-BADGE")
  })

  it("maps variant and size", () => {
    const element = rendered(Badge, { variant: "success", size: "sm" }) as SkBadgeElement
    expect(element.variant).toBe("success")
    expect(element.size).toBe("sm")
  })

  it("maps the dot variant and its accessible name", () => {
    // The status label is what makes the dot announced. The adapter's job is to
    // carry it; the element renders it visually hidden.
    const element = rendered(Badge, { dot: true, statusLabel: "Active" }) as SkBadgeElement
    expect(element.dot).toBe(true)
    expect(element.statusLabel).toBe("Active")
  })

  it("resolves the ref to the custom element", () => {
    const ref = exposedRef(Badge, {})
    expect((ref as HTMLElement).tagName).toBe("SK-BADGE")
  })

  it("merges the consumer class", () => {
    const wrapper = mount(Badge, { slots: { default: "New" }, attrs: { class: "status-chip" } })
    expect(wrapper.element.getAttribute("class")).toBe("status-chip")
  })
})
