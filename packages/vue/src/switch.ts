import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Switch — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * An on/off control rendered as a native checkbox carrying `role="switch"`: the
 * browser keeps validation and form submission, assistive technology reads the
 * state as on/off. The contract is the Checkbox contract; the distinction is
 * when it applies — a switch acts immediately, a checkbox is collected for a
 * later submit.
 *
 * `checked` is written as a property, so the element's own `@Prop` accessor
 * receives it. That is deliberate and it is the opposite of what the React
 * adapter does with the same prop: React has to reflect `defaultChecked` into
 * an attribute by hand, because React does not assign unknown custom-element
 * props as properties. Vue does assign them (`key in element`), so the adapter
 * stays out of the way and lets the element own both.
 */
export type SwitchSize = "sm" | "md" | "lg"
export type SwitchVariant = "default" | "quiet"

/** The element Stencil generates for `<sk-switch>`. */
export type SkSwitchElement = HTMLElement & {
  variant: SwitchVariant
  size: SwitchSize
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  /** The field's name in the form submission. */
  name: string | undefined
  checked: boolean
  defaultChecked: boolean
}

export const Switch = defineComponent({
  name: "SkSwitch",
  props: {
    /** Visual emphasis. */
    variant: optionalProp<SwitchVariant>(String),
    /** Label text size. The row target stays 44px at every size. */
    size: optionalProp<SwitchSize>(String),
    /** The label text, rendered beside the track. Wraps the control. */
    label: optionalProp<string>(String),
    /** Persistent helper text below the row. */
    description: optionalProp<string>(String),
    /** The validation message. Its presence drives `aria-invalid`. */
    error: optionalProp<string>(String),
    /** Marks the field invalid, with the same independence from `error` as Checkbox. */
    invalid: optionalProp<boolean>(Boolean),
    /** Disables interaction. Mirrors the ARIA name. */
    disabled: optionalProp<boolean>(Boolean),
    /** Native constraint validation still applies and is never suppressed. */
    required: optionalProp<boolean>(Boolean),
    /** Associates the control with a form it is not nested inside. */
    form: optionalProp<string>(String),
    /**
     * The field's name in the form submission.
     *
     * Forwarded to the element host attribute, which is how the platform
     * identifies a form-associated control. Without it the switch renders and
     * reports its value but contributes nothing to `FormData`.
     */
    name: optionalProp<string>(String),
    /** Whether the switch is on. An ARIA-mirroring boolean (ADR-013). */
    checked: optionalProp<boolean>(Boolean),
    /** Uncontrolled initial state. */
    defaultChecked: optionalProp<boolean>(Boolean),
    /** The submitted value when on. Defaults to `"on"`, the platform default. */
    value: optionalProp<string>(String),
    /** Optional HTML id. If omitted, a stable id is generated. */
    id: optionalProp<string>(String),
    /** Called when the user toggles the switch. */
    onValueChange: optionalProp<(checked: boolean) => void>(Function),
  },
  emits: ["update:checked"],
  setup(props, { emit, expose }) {
    const el = ref<SkSwitchElement | null>(null)
    expose(elementProxy(el))
    const generatedId = useId()

    return () =>
      h("sk-switch", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          variant: props.variant,
          size: props.size,
          label: props.label,
          description: props.description,
          error: props.error,
          invalid: props.invalid,
          disabled: props.disabled,
          required: props.required,
          form: props.form,
          name: props.name,
          checked: props.checked,
          defaultChecked: props.defaultChecked,
          value: props.value,
        }),
        onSkValueChange: (event: Event) => {
          const checked = (event as CustomEvent<{ checked: boolean }>).detail.checked
          props.onValueChange?.(checked)
          emit("update:checked", checked)
        },
      })
  },
})

export type SwitchProps = {
  variant?: SwitchVariant
  size?: SwitchSize
  label: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  form?: string
  name?: string
  checked?: boolean
  defaultChecked?: boolean
  value?: string
  id?: string
  onValueChange?: (checked: boolean) => void
}
