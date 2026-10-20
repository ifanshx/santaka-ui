import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Combobox — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. The ARIA 1.2 combobox pattern — focus never
 * leaving the input, `aria-activedescendant` reporting the active option, arrow
 * keys wrapping, Escape closing without clearing — is owned by
 * `@santaka-ui/web-components`. This adapter carries typing and the
 * `update:value` emit only.
 *
 * `options` is serialized for the same reason `Select`'s is: the element parses
 * it once rather than receiving a reactive proxy.
 */
export type ComboOption = { value: string; label: string }
export type SkComboboxElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  name: string
  placeholder: string
  options: string | ComboOption[]
  value: string
}

export const Combobox = defineComponent({
  name: "SkCombobox",
  props: {
    label: optionalProp<string>(String),
    description: optionalProp<string>(String),
    error: optionalProp<string>(String),
    invalid: optionalProp<boolean>(Boolean),
    disabled: optionalProp<boolean>(Boolean),
    name: optionalProp<string>(String),
    placeholder: optionalProp<string>(String),
    options: optionalProp<ComboOption[]>(Array),
    value: optionalProp<string>(String),
    id: optionalProp<string>(String),
    onValueChange: optionalProp<(value: string) => void>(Function),
  },
  setup(props, { emit, expose }) {
    const el = ref<SkComboboxElement | null>(null)
    expose(elementProxy(el))
    const generatedId = useId()
    return () =>
      h("sk-combobox", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          label: props.label,
          description: props.description,
          error: props.error,
          invalid: props.invalid,
          disabled: props.disabled,
          name: props.name,
          placeholder: props.placeholder,
          options: props.options ? JSON.stringify(props.options) : undefined,
          value: props.value,
        }),
        onSkValueChange: (event: Event) => {
          const value = (event as CustomEvent<{ value: string }>).detail.value
          props.onValueChange?.(value)
          emit("update:value", value)
        },
      })
  },
})

export type ComboboxProps = {
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  name?: string
  placeholder?: string
  options?: ComboOption[]
  value?: string
  id?: string
  onValueChange?: (value: string) => void
}
