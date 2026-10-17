import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Select — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Options arrive as objects and are serialized to JSON, the same contract the
 * React adapter and the plain-HTML attribute use. The element parses the string
 * once — both in its constructor and in its `options` watcher — so an updated
 * array re-renders the choices rather than being dropped.
 *
 * `defaultValue` maps to the element's `value` only in the element's own
 * uncontrolled logic; the adapter forwards both names unchanged, as React does.
 */
export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SkSelectElement = HTMLElement & {
  options: SelectOption[] | string
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  placeholder: string
  form: string | undefined
  value: string
  defaultValue: string
}

export const Select = defineComponent({
  name: "SkSelect",
  props: {
    /** The choices, as objects; the adapter serializes them to JSON. */
    options: optionalProp<SelectOption[]>(Array),
    variant: optionalProp<"default" | "quiet">(String),
    size: optionalProp<"sm" | "md" | "lg">(String),
    label: optionalProp<string>(String),
    description: optionalProp<string>(String),
    error: optionalProp<string>(String),
    invalid: optionalProp<boolean>(Boolean),
    disabled: optionalProp<boolean>(Boolean),
    required: optionalProp<boolean>(Boolean),
    /** Placeholder-style first choice, shown when the value is "". */
    placeholder: optionalProp<string>(String),
    form: optionalProp<string>(String),
    /**
     * The field's name in the form submission.
     *
     * The element has no `name` prop, so this lands as a host attribute — the
     * platform's way of identifying a form-associated control. Without it the
     * select renders and reports its value and contributes nothing to
     * `FormData`.
     */
    name: optionalProp<string>(String),
    /** The controlled value. */
    value: optionalProp<string>(String),
    /** Initial value for the uncontrolled case. */
    defaultValue: optionalProp<string>(String),
    id: optionalProp<string>(String),
    /** Fires only for user-initiated changes, per section 4. */
    onValueChange: optionalProp<(value: string) => void>(Function),
  },
  setup(props, { emit, expose }) {
    const el = ref<SkSelectElement | null>(null)
    expose(elementProxy(el))
    const generatedId = useId()

    return () =>
      h("sk-select", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          // Serialized: the element parses it once, not on every render.
          options: props.options ? JSON.stringify(props.options) : undefined,
          variant: props.variant,
          size: props.size,
          label: props.label,
          description: props.description,
          error: props.error,
          invalid: props.invalid,
          disabled: props.disabled,
          required: props.required,
          placeholder: props.placeholder,
          form: props.form,
          name: props.name,
          value: props.value,
          defaultValue: props.defaultValue,
        }),
        onSkValueChange: (event: Event) => {
          const value = (event as CustomEvent<{ value: string }>).detail.value
          props.onValueChange?.(value)
          emit("update:value", value)
        },
      })
  },
})

export type SelectProps = {
  options?: SelectOption[]
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  placeholder?: string
  form?: string
  name?: string
  value?: string
  defaultValue?: string
  id?: string
  onValueChange?: (value: string) => void
}
