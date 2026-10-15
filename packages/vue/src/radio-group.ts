import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * RadioGroup — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * An exclusive choice from a small set, rendered as real native radios so the
 * browser owns arrow-key navigation, the single tab stop, and constraint
 * validation. The group owns `name` and `required`; the checked radio's value is
 * what a plain form submits.
 *
 * Options arrive as objects and are serialized to JSON, the same contract the
 * React adapter and the plain-HTML attribute use. The element parses the string
 * once — in its constructor and again in its `options` watcher — so an updated
 * array re-renders the choices rather than being dropped. The serialization is
 * why this adapter does not declare an `options` validator beyond `Array`: the
 * element owns the shape.
 */
export type RadioGroupSize = "sm" | "md" | "lg"
export type RadioGroupVariant = "default" | "quiet"

export type RadioOption = {
  value: string
  label: string
  disabled?: boolean
}

/** The element Stencil generates for `<sk-radio-group>`. */
export type SkRadioGroupElement = HTMLElement & {
  options: RadioOption[] | string
  variant: RadioGroupVariant
  size: RadioGroupSize
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  /** The submitted name. Every radio in the group carries it. */
  name: string
  value: string
  defaultValue: string
}

export const RadioGroup = defineComponent({
  name: "SkRadioGroup",
  props: {
    /** The choices, as objects; the adapter serializes them to JSON. */
    options: optionalProp<RadioOption[]>(Array),
    /** Visual emphasis. */
    variant: optionalProp<RadioGroupVariant>(String),
    /** Label text size. The row target stays 44px at every size. */
    size: optionalProp<RadioGroupSize>(String),
    /** The group's own label text, rendered above the options. */
    label: optionalProp<string>(String),
    /** Persistent helper text below the group. */
    description: optionalProp<string>(String),
    /** The validation message. Its presence drives `aria-invalid`. */
    error: optionalProp<string>(String),
    /** Marks the field invalid, with the same independence from `error` as Input. */
    invalid: optionalProp<boolean>(Boolean),
    /** Disables interaction. Mirrors the ARIA name. */
    disabled: optionalProp<boolean>(Boolean),
    /** Native constraint validation still applies and is never suppressed. */
    required: optionalProp<boolean>(Boolean),
    /** Associates the control with a form it is not nested inside. */
    form: optionalProp<string>(String),
    /**
     * The submitted name. Every radio in the group carries it.
     *
     * The element has no `name` prop, so this lands as a host attribute — the
     * platform's way of identifying a form-associated control. Without it the
     * group renders and reports its value and contributes nothing to `FormData`.
     */
    name: optionalProp<string>(String),
    /** The value. Uncontrolled by default; omit for nothing selected. */
    value: optionalProp<string>(String),
    /** Uncontrolled initial value. */
    defaultValue: optionalProp<string>(String),
    /** Optional HTML id. If omitted, a stable id is generated. */
    id: optionalProp<string>(String),
    /** Called when the user selects an option. */
    onValueChange: optionalProp<(value: string) => void>(Function),
  },
  emits: ["update:value"],
  setup(props, { emit, expose }) {
    const el = ref<SkRadioGroupElement | null>(null)
    expose(elementProxy(el))
    const generatedId = useId()

    return () =>
      h("sk-radio-group", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          // Serialized: the element parses it once, not on every render. Same
          // contract as Select, whose options take the identical path.
          options: props.options ? JSON.stringify(props.options) : undefined,
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
          value: props.value,
          defaultValue: props.defaultValue,
        }),
        // The event arrives from the custom element host, not the inner radio,
        // so the payload is `detail` — the same contract Input and Select adapt.
        onSkValueChange: (event: Event) => {
          const value = (event as CustomEvent<{ value: string }>).detail.value
          props.onValueChange?.(value)
          emit("update:value", value)
        },
      })
  },
})

export type RadioGroupProps = {
  options: RadioOption[]
  variant?: RadioGroupVariant
  size?: RadioGroupSize
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  form?: string
  name: string
  value?: string
  defaultValue?: string
  id?: string
  onValueChange?: (value: string) => void
}
