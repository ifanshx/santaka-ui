import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { Button, type SkButtonElement } from "./button.js"

/**
 * These tests cover the Vue adapter's own contract: the prop mapping onto the
 * custom element, the `class` merge order, and the ref. They deliberately do
 * not assert the component's behavior — that is owned by
 * `@santaka-ui/web-components` and proven in a real browser there.
 *
 * Assertions read *properties*, not attributes: with the stub custom element
 * registered, Vue 3 assigns props as element properties (it checks `key in
 * element`), which is what a browser does with a defined element.
 */
const rendered = (props: Record<string, unknown> = {}, slots?: Record<string, string>) =>
  mount(Button, { props, slots }).element as SkButtonElement

describe("Button adapter", () => {
  it("renders the custom element, not a native button", () => {
    const wrapper = mount(Button, { slots: { default: "Save" } })
    expect(wrapper.element.tagName).toBe("SK-BUTTON")
    expect(wrapper.find("button").exists()).toBe(false)
  })

  it("passes variant and size through to the element", () => {
    const element = rendered({ variant: "danger", size: "lg" })
    expect(element.variant).toBe("danger")
    expect(element.size).toBe("lg")
  })

  it("leaves an unset prop at the element default", () => {
    const element = rendered()
    expect(element.variant).toBe("primary")
    expect(element.size).toBe("md")
    expect(element.disabled).toBe(false)
  })

  it("maps disabled and loading to their ARIA-named props", () => {
    const element = rendered({ disabled: true, loading: true })
    expect(element.disabled).toBe(true)
    expect(element.loading).toBe(true)
  })

  it("merges the consumer class so consumer styles win", () => {
    const wrapper = mount(Button, { attrs: { class: "my-button" } })
    expect(wrapper.element.getAttribute("class")).toBe("my-button")
  })

  it("resolves a template ref to the custom element", () => {
    const wrapper = mount(Button)
    expect((wrapper.vm.$el as HTMLElement).tagName).toBe("SK-BUTTON")
  })

  it("renders children into the element's slot", () => {
    const wrapper = mount(Button, { slots: { default: "Save changes" } })
    expect(wrapper.text()).toBe("Save changes")
  })

  it("accepts type for form participation", () => {
    const element = rendered({ type: "submit" })
    expect(element.type).toBe("submit")
  })
})
