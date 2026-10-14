import { createRef } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RadioGroup, type SkRadioGroupElement } from "./radio-group.js"

/**
 * Adapter contract tests: prop mapping onto the custom element, the generated
 * id, `className` merge order, the ref, and the change callback. The behavior
 * itself — native radio navigation, FACE on the group, validation — is owned
 * by `@santaka-ui/web-components` and proven in Chromium there.
 */

const OPTIONS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development", disabled: true },
]

const rendered = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("sk-radio-group") as SkRadioGroupElement
}

describe("RadioGroup adapter", () => {
  it("renders the custom element", () => {
    const { container } = render(<RadioGroup name="env" options={OPTIONS} />)
    expect(container.querySelector("sk-radio-group")).not.toBeNull()
    // Not bare native radios: the custom element owns the FACE behavior.
    expect(container.querySelector("input")).toBeNull()
  })

  it("serializes options to JSON, the same path Select takes", () => {
    const { container } = render(<RadioGroup name="env" options={OPTIONS} />)
    const element = container.querySelector("sk-radio-group")!
    // React 19 sets a *property* when the element defines one, and falls back
    // to the attribute otherwise. The stub defines an `options` property, so
    // the delivery is read there; the element parses whatever it receives once
    // on upgrade.
    const received = (element as HTMLElement & { options: unknown }).options
    expect(JSON.parse(String(received))).toEqual(OPTIONS)
  })

  it("maps variant and size", () => {
    const element = rendered(<RadioGroup name="env" options={OPTIONS} variant="quiet" size="lg" />)
    expect(element.variant).toBe("quiet")
    expect(element.size).toBe("lg")
  })

  it("maps the labeling props", () => {
    const element = rendered(
      <RadioGroup
        name="env"
        options={OPTIONS}
        label="Environment"
        description="Where the build deploys"
        error="Choose one"
        invalid
        required
      />,
    )
    expect(element.label).toBe("Environment")
    expect(element.description).toBe("Where the build deploys")
    expect(element.error).toBe("Choose one")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps name and value", () => {
    const element = rendered(<RadioGroup name="env" options={OPTIONS} value="staging" />)
    expect(element.name).toBe("env")
    expect(element.value).toBe("staging")
  })

  it("maps disabled and form", () => {
    const element = rendered(<RadioGroup name="env" options={OPTIONS} disabled form="deploy" />)
    expect(element.disabled).toBe(true)
    expect(element.form).toBe("deploy")
  })

  it("generates a stable id with useId so the element can name its group", () => {
    const element = rendered(<RadioGroup name="env" options={OPTIONS} />)
    const id = element.getAttribute("id")
    // The exact shape is React version-dependent, so the assertion is that an
    // id exists and is non-empty, not what it looks like.
    expect(id).toBeTruthy()
    expect(id).not.toBe("")
  })

  it("passes an explicit id through", () => {
    const element = rendered(<RadioGroup name="env" options={OPTIONS} id="env-group" />)
    expect(element.getAttribute("id")).toBe("env-group")
  })

  it("forwards the ref to the custom element", () => {
    const ref = createRef<SkRadioGroupElement>()
    render(<RadioGroup name="env" options={OPTIONS} ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName.toLowerCase()).toBe("sk-radio-group")
  })

  it("merges className last so consumer styles win", () => {
    const element = rendered(<RadioGroup name="env" options={OPTIONS} className="consumer-class" />)
    expect(element.getAttribute("class")).toBe("consumer-class")
  })

  it("wires onValueChange to sk-value-change", async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <RadioGroup name="env" options={OPTIONS} onValueChange={onValueChange} />,
    )
    const element = container.querySelector("sk-radio-group") as HTMLElement & {
      onValueChange?: unknown
    }
    // The adapter listens for the native sk-value-change CustomEvent.
    element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "staging" }, bubbles: true }),
    )
    await Promise.resolve()
    expect(onValueChange).toHaveBeenCalledWith("staging")
  })
})
