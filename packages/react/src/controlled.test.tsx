import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  Checkbox,
  Input,
  RadioGroup,
  Textarea,
  type SkCheckboxElement,
  type SkInputElement,
  type SkRadioGroupElement,
  type SkTextareaElement,
} from "./index.js"

/**
 * Controlled and uncontrolled value semantics (docs/ARCHITECTURE.md §15: "keyboard
 * interaction, focus return, accessible labeling, and controlled/uncontrolled
 * behavior").
 *
 * React keeps two channels, and they are separate on purpose:
 *
 *   - `value` / `checked` is the controlled channel. React owns it, and a change
 *     to the prop is re-asserted on the element.
 *   - `defaultValue` / `defaultChecked` seeds the element once. React does not
 *     re-assert it, which is what makes a field uncontrolled.
 *
 * What is tested here is the adapter handing each channel to the element, which
 * is the part the adapter owns. The element's own behavior — what it does with
 * the seed, when it re-reads it on a form reset — belongs to
 * `@santaka-ui/web-components` and is proven in Chromium there.
 *
 * Three claims per component, and the third is the one that has teeth:
 *
 *   1. the controlled prop reaches the controlled channel,
 *   2. the uncontrolled prop reaches the initial channel,
 *   3. the uncontrolled prop does *not* populate the controlled channel — the
 *      bug that would make a controlled field behave as if it were not one.
 *
 * Switch and Select already cover the first two in their own files; these are
 * the four adapters that declared an uncontrolled initial value with nothing
 * asserting the declaration.
 */

const OPTIONS = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
]

describe("Input controlled and uncontrolled value", () => {
  const rendered = (ui: React.ReactElement) => {
    const { container } = render(ui)
    return container.querySelector("sk-input") as SkInputElement
  }

  it("puts the controlled value on the element's value property", () => {
    expect(rendered(<Input label="Email" value="draft" />).value).toBe("draft")
  })

  it("seeds an uncontrolled field and leaves the controlled channel alone", () => {
    const element = rendered(<Input label="Email" defaultValue="seed" />)
    // `default-value` has no property on the stub, so React wrote the attribute;
    // `value` does, so a stray write there is what this asserts against.
    expect(element.getAttribute("default-value")).toBe("seed")
    expect(element.value).toBe("")
  })

  it("re-asserts the controlled value when the prop changes", () => {
    const { container, rerender } = render(<Input label="Email" value="first" />)
    const element = container.querySelector("sk-input") as SkInputElement
    expect(element.value).toBe("first")

    rerender(<Input label="Email" value="second" />)
    expect(element.value).toBe("second")
  })
})

describe("Textarea controlled and uncontrolled value", () => {
  const rendered = (ui: React.ReactElement) => {
    const { container } = render(ui)
    return container.querySelector("sk-textarea") as SkTextareaElement
  }

  it("puts the controlled value on the element's value property", () => {
    expect(rendered(<Textarea label="Bio" value="draft" />).value).toBe("draft")
  })

  it("seeds an uncontrolled field and leaves the controlled channel alone", () => {
    const element = rendered(<Textarea label="Bio" defaultValue="seed" />)
    expect(element.getAttribute("default-value")).toBe("seed")
    expect(element.value).toBe("")
  })
})

describe("RadioGroup controlled and uncontrolled value", () => {
  const rendered = (ui: React.ReactElement) => {
    const { container } = render(ui)
    return container.querySelector("sk-radio-group") as SkRadioGroupElement
  }

  it("puts the controlled value on the element, and the seed on its own channel", () => {
    const controlled = rendered(<RadioGroup name="env" label="Env" options={OPTIONS} value="b" />)
    expect(controlled.value).toBe("b")

    const seeded = rendered(
      <RadioGroup name="env" label="Env" options={OPTIONS} defaultValue="a" />,
    )
    expect(seeded.defaultValue).toBe("a")
    // The seed must not become the submitted value before the user picks one.
    expect(seeded.value).toBe("")
  })
})

describe("Checkbox controlled and uncontrolled checked", () => {
  const rendered = (ui: React.ReactElement) => {
    const { container } = render(ui)
    return container.querySelector("sk-checkbox") as SkCheckboxElement
  }

  it("puts the controlled checked on the element", () => {
    expect(rendered(<Checkbox label="Accept" checked />).checked).toBe(true)
  })

  it("seeds an uncontrolled box and leaves the controlled channel alone", () => {
    const element = rendered(<Checkbox label="Accept" defaultChecked />)
    expect(element.defaultChecked).toBe(true)
    // A controlled checkbox that was never checked must not read as checked
    // because a seed was also passed.
    expect(element.checked).toBe(false)
  })

  it("re-asserts checked when the prop changes", () => {
    const { container, rerender } = render(<Checkbox label="Accept" checked={false} />)
    const element = container.querySelector("sk-checkbox") as SkCheckboxElement

    rerender(<Checkbox label="Accept" checked />)
    expect(element.checked).toBe(true)
  })
})
