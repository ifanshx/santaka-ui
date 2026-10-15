import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { Checkbox } from "./checkbox.js"
import { Select } from "./select.js"
import { Switch } from "./switch.js"
import { RadioGroup } from "./radio-group.js"

/**
 * `name` must survive the adapter, and it must land on the channel the element
 * actually reads.
 *
 * The React suite documents the regression this mirrors: three adapters dropped
 * `name`, and the failure was invisible from inside the framework — the element
 * rendered, took focus, validated, and reported its value through the change
 * callback. It simply was not submitted, because a form-associated custom
 * element with no `name` attribute is unnamed, and an unnamed control
 * contributes nothing to `FormData`.
 *
 * The Vue half has a wrinkle the React half does not, and it is why these tests
 * do not all assert the same thing. Vue chooses between a property and an
 * attribute with `key in element`:
 *
 *   - Checkbox, Switch, and Select declare `name?: string` with **no
 *     initializer** in the element source. A declaration-only class field emits
 *     nothing at the package's `target`, so `"name" in element` is false and Vue
 *     falls through to `patchAttr` — the attribute, which is the channel a
 *     form-associated custom element is identified by. These three assert the
 *     attribute.
 *
 *   - RadioGroup declares `name = ""` **with** an initializer, so it is a real
 *     own property, `"name" in element` is true, and Vue takes the property
 *     path. The element reads its own `name` and reflects it back to the
 *     attribute (`@Prop({ reflect: true })`), but the jsdom stub in
 *     `test-setup.ts` implements no reflection, so the property is the channel
 *     this test can read. It asserts the property, and the browser run in
 *     `examples/react-vite/e2e` covers the reflection.
 *
 * The stub mirrors the shipped element on purpose: if it declared `name = ""`
 * for Checkbox, Vue would take the property path and this file would be
 * asserting a route no browser takes — a green test over a real bug.
 *
 * jsdom has no form submission and no form-associated custom element
 * implementation, so these tests cannot prove the control is *submitted*. They
 * prove the half the adapter owns: the name reaches the element, under the
 * value the consumer asked for.
 */
describe("the Vue adapters put `name` on the channel the element reads", () => {
  it("Checkbox writes name as the attribute", () => {
    const wrapper = mount(Checkbox, { props: { name: "terms", label: "Accept" } })
    expect(wrapper.element.getAttribute("name")).toBe("terms")
  })

  it("Switch writes name as the attribute", () => {
    const wrapper = mount(Switch, { props: { name: "updates", label: "Updates" } })
    expect(wrapper.element.getAttribute("name")).toBe("updates")
  })

  it("Select writes name as the attribute", () => {
    const wrapper = mount(Select, {
      props: {
        name: "plan",
        label: "Plan",
        options: [
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro" },
        ],
      },
    })
    expect(wrapper.element.getAttribute("name")).toBe("plan")
  })

  it("RadioGroup writes name as the property its element declares", () => {
    const wrapper = mount(RadioGroup, {
      props: {
        name: "env",
        options: [
          { value: "production", label: "Production" },
          { value: "staging", label: "Staging" },
        ],
      },
    })
    expect((wrapper.element as HTMLElement & { name: string }).name).toBe("env")
  })

  it("omits the attribute when no name is given, rather than emitting name=''", () => {
    // An empty `name` is not the same as no name: the platform treats `name=""`
    // as a name, and the control would be submitted under it. Vue drops the
    // `undefined` through `elementProps`, so nothing is written at all.
    const wrapper = mount(Checkbox, { props: { label: "Accept" } })
    expect(wrapper.element.hasAttribute("name")).toBe(false)
  })

  it("Checkbox forwards `value`, so the consumer chooses what the form receives", () => {
    // The element has always had this prop — `"on"` is the platform default —
    // but an adapter that never forwards it leaves the submitted value
    // unreachable. `value` is an own property on the element (`value = "on"`),
    // so Vue writes it as a property, and that is where it is read.
    const wrapper = mount(Checkbox, {
      props: { name: "terms", label: "Accept", value: "accepted" },
    })
    expect((wrapper.element as HTMLElement & { value: string }).value).toBe("accepted")

    const defaulted = mount(Checkbox, { props: { name: "terms", label: "Accept" } })
    // Not forwarded, so the element's own default stands rather than becoming
    // `undefined` — which is what keeps it matching a native checkbox.
    expect((defaulted.element as HTMLElement & { value: string }).value).toBe("on")
  })
})
