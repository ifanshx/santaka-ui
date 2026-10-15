import { h } from "vue"
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { Input, type SkInputElement } from "./input.js"
import { Textarea, type SkTextareaElement } from "./textarea.js"
import { Select, type SkSelectElement } from "./select.js"
import { Switch, type SkSwitchElement } from "./switch.js"
import { RadioGroup, type SkRadioGroupElement } from "./radio-group.js"
import { Checkbox, type SkCheckboxElement } from "./checkbox.js"

/**
 * Adapter contract tests for the form controls: prop mapping onto the custom
 * element, the generated id, the class merge, the ref, and the change callback.
 * The behavior itself — form participation, native validation, reset — is owned
 * by `@santaka-ui/web-components` and proven in Chromium there.
 *
 * The event assertions read the *native* `sk-value-change` CustomEvent the
 * element dispatches, because that event is the single source of truth. The
 * adapter also emits `update:value` / `update:checked` for `v-model`; that is
 * the Vue spelling of the same fact, and it is asserted separately rather than
 * being allowed to stand in for the native contract.
 */
const OPTIONS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
]

const RADIO_OPTIONS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development", disabled: true },
]

describe("Input adapter", () => {
  it("renders the custom element, not a native input", () => {
    const wrapper = mount(Input, { props: { label: "Email" } })
    expect(wrapper.element.tagName).toBe("SK-INPUT")
    // Not a bare native input: the custom element owns the FACE behavior.
    expect(wrapper.find("input").exists()).toBe(false)
  })

  it("maps type, variant, and size", () => {
    const element = mount(Input, { props: { type: "email", variant: "quiet", size: "lg" } })
      .element as SkInputElement
    expect(element.type).toBe("email")
    expect(element.variant).toBe("quiet")
    expect(element.size).toBe("lg")
  })

  it("defaults to a text field at medium size", () => {
    const element = mount(Input).element as SkInputElement
    expect(element.type).toBe("text")
    expect(element.size).toBe("md")
    expect(element.variant).toBe("default")
  })

  it("maps the labeling props", () => {
    const element = mount(Input, {
      props: {
        label: "Handle",
        description: "Shown publicly",
        error: "Taken",
        invalid: true,
        required: true,
      },
    }).element as SkInputElement
    expect(element.label).toBe("Handle")
    expect(element.description).toBe("Shown publicly")
    expect(element.error).toBe("Taken")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps readOnly, which is what distinguishes it from disabled", () => {
    const readOnly = mount(Input, { props: { readOnly: true } }).element as SkInputElement
    expect(readOnly.readOnly).toBe(true)
    expect(readOnly.disabled).toBe(false)

    const disabled = mount(Input, { props: { disabled: true } }).element as SkInputElement
    expect(disabled.disabled).toBe(true)
  })

  it("generates a stable id so the element can associate its label", () => {
    const element = mount(Input, { props: { label: "Email" } }).element
    const id = element.getAttribute("id")
    // The exact shape is Vue-version-dependent, so the assertion is that an id
    // exists and is non-empty, not what it looks like.
    expect(id).toBeTruthy()
    expect(id).not.toBe("")
  })

  it("prefers an explicit id, which SSR consumers must pass", () => {
    // Section 4: Vue's useId and the Web Components counter do not agree, so a
    // separately-rendered Label only finds the control under SSR if the consumer
    // supplies the id.
    const element = mount(Input, { props: { id: "server-field", label: "Email" } }).element
    expect(element.getAttribute("id")).toBe("server-field")
  })

  it("maps the native constraint props", () => {
    // `minlength`/`maxlength` are the attributes whose names differ from the
    // camelCase props, so the stub observes them; this is the one mapping where
    // the attribute path is the contract rather than an accident of `in`.
    const element = mount(Input, { props: { minLength: 2, maxLength: 8, pattern: "[0-9]+" } })
      .element as SkInputElement
    expect(element.minLength).toBe(2)
    expect(element.maxLength).toBe(8)
    expect(element.pattern).toBe("[0-9]+")
  })

  it("maps form association props", () => {
    const element = mount(Input, {
      props: { name: "email", form: "login", autocomplete: "email" },
    }).element
    expect(element.getAttribute("name")).toBe("email")
    expect(element.getAttribute("form")).toBe("login")
    expect(element.getAttribute("autocomplete")).toBe("email")
  })

  it("calls onValueChange with the detail value", () => {
    const onValueChange = vi.fn()
    const wrapper = mount(Input, { props: { onValueChange } })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "typed" } }),
    )
    expect(onValueChange).toHaveBeenCalledWith("typed")
  })

  it("emits update:value so v-model works", () => {
    const wrapper = mount(Input, { props: { value: "" } })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "typed" } }),
    )
    expect(wrapper.emitted("update:value")?.[0]).toEqual(["typed"])
  })

  it("leaves onValueChange unset without crashing", () => {
    const wrapper = mount(Input)
    expect(() =>
      wrapper.element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { value: "x" } })),
    ).not.toThrow()
  })
})

describe("Textarea adapter", () => {
  it("renders the custom element, not a native textarea", () => {
    const wrapper = mount(Textarea, { props: { label: "Bio" } })
    expect(wrapper.element.tagName).toBe("SK-TEXTAREA")
    expect(wrapper.find("textarea").exists()).toBe(false)
  })

  it("maps rows and variant", () => {
    const element = mount(Textarea, { props: { rows: 8, variant: "quiet" } })
      .element as SkTextareaElement
    expect(element.rows).toBe(8)
    expect(element.variant).toBe("quiet")
  })

  it("defaults to four rows at the default variant", () => {
    const element = mount(Textarea).element as SkTextareaElement
    expect(element.rows).toBe(4)
    expect(element.variant).toBe("default")
  })

  it("maps the labeling props", () => {
    const element = mount(Textarea, {
      props: {
        label: "Notes",
        description: "Markdown",
        error: "Required",
        invalid: true,
        required: true,
      },
    }).element as SkTextareaElement
    expect(element.label).toBe("Notes")
    expect(element.description).toBe("Markdown")
    expect(element.error).toBe("Required")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps readOnly, which is what distinguishes it from disabled", () => {
    const readOnly = mount(Textarea, { props: { readOnly: true } }).element as SkTextareaElement
    expect(readOnly.readOnly).toBe(true)
    expect(readOnly.disabled).toBe(false)

    expect(
      (mount(Textarea, { props: { disabled: true } }).element as SkTextareaElement).disabled,
    ).toBe(true)
  })

  it("maps the length bounds", () => {
    const element = mount(Textarea, { props: { minLength: 5, maxLength: 10 } })
      .element as SkTextareaElement
    expect(element.minLength).toBe(5)
    expect(element.maxLength).toBe(10)
  })

  it("calls onValueChange with the detail value", () => {
    const onValueChange = vi.fn()
    const wrapper = mount(Textarea, { props: { onValueChange } })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "typed" } }),
    )
    expect(onValueChange).toHaveBeenCalledWith("typed")
  })
})

describe("Select adapter", () => {
  it("serializes options to JSON for the element to parse", () => {
    const wrapper = mount(Select, { props: { options: OPTIONS } })
    const element = wrapper.element as SkSelectElement
    // The stub defines `options` as a property, so Vue writes the property;
    // the element parses whatever it receives once on upgrade.
    expect(JSON.parse(String(element.options))).toEqual(OPTIONS)
  })

  it("maps the field props", () => {
    const element = mount(Select, {
      props: {
        options: OPTIONS,
        label: "Environment",
        description: "Where it deploys.",
        error: "Required.",
        invalid: true,
        disabled: true,
        required: true,
        placeholder: "Choose",
      },
    }).element as SkSelectElement
    expect(element.label).toBe("Environment")
    expect(element.description).toBe("Where it deploys.")
    expect(element.error).toBe("Required.")
    expect(element.invalid).toBe(true)
    expect(element.disabled).toBe(true)
    expect(element.required).toBe(true)
    expect(element.placeholder).toBe("Choose")
  })

  it("maps value and defaultValue to their channels", () => {
    const wrapper = mount(Select, {
      props: { options: OPTIONS, value: "staging", defaultValue: "production" },
    })
    const element = wrapper.element as SkSelectElement
    // Both are properties on the element, so Vue wrote properties, not
    // attributes. `defaultValue` is a prop on the element and is therefore an
    // own property — writing it as `default-value` would be the accident, not
    // the contract.
    expect(element.value).toBe("staging")
    expect(element.defaultValue).toBe("production")
  })

  it("calls onValueChange with the detail value", () => {
    const onValueChange = vi.fn()
    const wrapper = mount(Select, { props: { options: OPTIONS, onValueChange } })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "staging" } }),
    )
    expect(onValueChange).toHaveBeenCalledWith("staging")
  })
})

describe("Switch adapter", () => {
  it("maps checked as the ARIA-mirroring boolean, not isOn", () => {
    const on = mount(Switch, { props: { label: "Dark mode", checked: true } })
      .element as SkSwitchElement
    expect(on.checked).toBe(true)

    const off = mount(Switch, { props: { label: "Dark mode" } }).element as SkSwitchElement
    expect(off.checked).toBe(false)
  })

  it("maps defaultChecked for the uncontrolled case", () => {
    const element = mount(Switch, { props: { label: "Dark mode", defaultChecked: true } })
      .element as SkSwitchElement
    expect(element.defaultChecked).toBe(true)
  })

  it("calls onValueChange with the checked detail, not the whole detail", () => {
    const onValueChange = vi.fn()
    const wrapper = mount(Switch, { props: { label: "Dark mode", onValueChange } })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { checked: true }, bubbles: true }),
    )
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it("emits update:checked so v-model:checked works", () => {
    const wrapper = mount(Switch, { props: { label: "Dark mode" } })
    wrapper.element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { checked: true } }))
    expect(wrapper.emitted("update:checked")?.[0]).toEqual([true])
  })
})

describe("RadioGroup adapter", () => {
  it("serializes options to JSON, the same path Select takes", () => {
    const wrapper = mount(RadioGroup, { props: { name: "env", options: RADIO_OPTIONS } })
    const element = wrapper.element as SkRadioGroupElement
    expect(JSON.parse(String(element.options))).toEqual(RADIO_OPTIONS)
  })

  it("maps variant and size", () => {
    const element = mount(RadioGroup, {
      props: { name: "env", options: RADIO_OPTIONS, variant: "quiet", size: "lg" },
    }).element as SkRadioGroupElement
    expect(element.variant).toBe("quiet")
    expect(element.size).toBe("lg")
  })

  it("maps the labeling props", () => {
    const element = mount(RadioGroup, {
      props: {
        name: "env",
        options: RADIO_OPTIONS,
        label: "Environment",
        description: "Where the build deploys",
        error: "Choose one",
        invalid: true,
        required: true,
      },
    }).element as SkRadioGroupElement
    expect(element.label).toBe("Environment")
    expect(element.description).toBe("Where the build deploys")
    expect(element.error).toBe("Choose one")
    expect(element.invalid).toBe(true)
    expect(element.required).toBe(true)
  })

  it("maps value and disabled", () => {
    const element = mount(RadioGroup, {
      props: { name: "env", options: RADIO_OPTIONS, value: "staging", disabled: true },
    }).element as SkRadioGroupElement
    expect(element.value).toBe("staging")
    expect(element.disabled).toBe(true)
  })

  it("calls onValueChange with the detail value", () => {
    const onValueChange = vi.fn()
    const wrapper = mount(RadioGroup, {
      props: { name: "env", options: RADIO_OPTIONS, onValueChange },
    })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "staging" }, bubbles: true }),
    )
    expect(onValueChange).toHaveBeenCalledWith("staging")
  })

  it("emits update:value so v-model:value works", () => {
    const wrapper = mount(RadioGroup, { props: { name: "env", options: RADIO_OPTIONS } })
    wrapper.element.dispatchEvent(
      new CustomEvent("sk-value-change", { detail: { value: "staging" } }),
    )
    expect(wrapper.emitted("update:value")?.[0]).toEqual(["staging"])
  })
})

describe("Checkbox adapter", () => {
  it("maps checked and indeterminate", () => {
    const element = mount(Checkbox, {
      props: { label: "Accept", checked: true, indeterminate: true },
    }).element as SkCheckboxElement
    expect(element.checked).toBe(true)
    expect(element.indeterminate).toBe(true)
  })

  it("calls onValueChange with the checked detail", () => {
    const onValueChange = vi.fn()
    const wrapper = mount(Checkbox, { props: { label: "Accept", onValueChange } })
    wrapper.element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { checked: true } }))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it("emits update:checked so v-model:checked works", () => {
    const wrapper = mount(Checkbox, { props: { label: "Accept" } })
    wrapper.element.dispatchEvent(new CustomEvent("sk-value-change", { detail: { checked: true } }))
    expect(wrapper.emitted("update:checked")?.[0]).toEqual([true])
  })

  it("takes no children, because the element renders no slot", () => {
    // The element draws its own `<label>` around the control and takes the text
    // through the `label` prop; there is no `<slot>` in its render tree, so a
    // child passed here would be dead markup. React's adapter matches by having
    // no `children` prop either. This asserts the boundary rather than assuming
    // the adapter silently drops what the element cannot place.
    const wrapper = mount(Checkbox, {
      props: { label: "Accept" },
      slots: { default: () => h("span", null, "Terms") },
    })
    expect(wrapper.element.querySelector("span")).toBeNull()
    expect((wrapper.element as SkCheckboxElement).label).toBe("Accept")
  })
})

/**
 * The field controls take no slot, and the adapters must not pretend otherwise.
 *
 * `sk-input`, `sk-textarea`, `sk-select`, `sk-switch`, `sk-checkbox`, and
 * `sk-radio-group` render their own label and control and read the label text
 * from the `label` prop; none of them renders a `<slot>`. React's adapters match
 * by accepting no `children`. A Vue adapter that *declares* a default slot
 * invites a consumer to write `default` content, which the element then has
 * nowhere to put — the content is silently dropped. Two of the six used to
 * declare the slot without ever rendering it, and two rendered it into an
 * element with no `<slot>` to receive it. Both are the same defect from
 * opposite sides: a declared slot that no one can honor.
 *
 * The check is per-adapter rather than a snapshot, so the failure names the
 * component that regressed.
 */

describe("Field controls take no default slot", () => {
  const CASES: Array<[string, unknown, Record<string, unknown>]> = [
    ["Input", Input, {}],
    ["Textarea", Textarea, {}],
    ["Select", Select, { options: OPTIONS }],
    ["Switch", Switch, { label: "Dark mode" }],
    ["Checkbox", Checkbox, { label: "Accept" }],
    ["RadioGroup", RadioGroup, { name: "env", options: RADIO_OPTIONS }],
  ]

  for (const [name, component, props] of CASES) {
    it(`${name} drops a default slot rather than rendering an orphan child`, () => {
      const wrapper = mount(component as Parameters<typeof mount>[0], {
        props,
        slots: { default: () => h("span", { class: "orphan" }, "x") },
      })
      // Nothing is placed: the element has no slot to distribute it into, so the
      // only honest outcome is that the child is absent.
      expect(wrapper.element.querySelector(".orphan")).toBeNull()
      // The slot is also not declared on the component, which is what stops a
      // consumer's type-checker from suggesting one.
      expect((component as { slots?: unknown }).slots).toBeUndefined()
    })
  }
})
