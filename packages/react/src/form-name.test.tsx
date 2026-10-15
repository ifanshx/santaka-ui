import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Checkbox } from "./checkbox.js"
import { Select } from "./select.js"
import { Switch } from "./switch.js"

/**
 * `name` must survive the adapter.
 *
 * These three adapters dropped `name`, and the failure was invisible from
 * inside React: the element rendered, took focus, validated, and reported its
 * value through `onValueChange`. It simply was not submitted, because a
 * form-associated custom element with no `name` attribute is unnamed, and an
 * unnamed control contributes nothing to `FormData`. Nothing in the adapter's
 * own tests looked at `name`, so nothing caught it.
 *
 * The React unit tests run under jsdom, which has no form submission and no
 * form-associated custom element implementation — so they cannot prove the
 * control is *submitted*. What they can prove is the half this file owns: the
 * adapter puts `name` on the element. The other half — that the browser then
 * submits it — is proven in a real browser in `examples/react-vite/e2e`.
 *
 * That split is deliberate. A jsdom test that "submitted a form" would be
 * asserting against a stub, and a browser test is the only place the claim is
 * real. This test exists so the regression is caught in milliseconds rather
 * than in a browser run.
 */

describe("the React adapters forward `name`", () => {
  it("Checkbox puts name on the element", () => {
    const { container } = render(<Checkbox name="terms" label="Accept" />)
    const element = container.querySelector("sk-checkbox")
    expect(element).not.toBeNull()
    expect(element?.getAttribute("name")).toBe("terms")
  })

  it("Switch puts name on the element", () => {
    const { container } = render(<Switch name="updates" label="Updates" />)
    const element = container.querySelector("sk-switch")
    expect(element).not.toBeNull()
    expect(element?.getAttribute("name")).toBe("updates")
  })

  it("Select puts name on the element", () => {
    const { container } = render(
      <Select
        name="plan"
        label="Plan"
        options={[
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro" },
        ]}
      />,
    )
    const element = container.querySelector("sk-select")
    expect(element).not.toBeNull()
    expect(element?.getAttribute("name")).toBe("plan")
  })

  it("omits the attribute when no name is given, rather than emitting name=''", () => {
    // An empty `name` is not the same as no name: the platform treats
    // `name=""` as a name, and the control would be submitted under it.
    const { container } = render(<Checkbox label="Accept" />)
    expect(container.querySelector("sk-checkbox")?.hasAttribute("name")).toBe(false)
  })

  it("Checkbox forwards `value`, so the consumer chooses what the form receives", () => {
    // The element has always had this prop — `"on"` is the platform default — but
    // the adapter never forwarded it, so the submitted value was unreachable from
    // React. Switch forwarded its own `value` the whole time; this asserts the
    // same prop now exists on the checkbox path, and that the default still
    // matches a native checkbox rather than becoming `undefined`.
    const { container } = render(<Checkbox name="terms" label="Accept" value="accepted" />)
    expect(container.querySelector("sk-checkbox")?.getAttribute("value")).toBe("accepted")

    const { container: defaulted } = render(<Checkbox name="terms" label="Accept" />)
    expect(defaulted.querySelector("sk-checkbox")?.getAttribute("value")).toBe("on")
  })
})
