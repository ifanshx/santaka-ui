import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Field — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The control goes in the default slot rather than a prop, for the same reason
 * as the React adapter: this component labels a control the consumer already
 * has, and taking ownership of it would defeat the point.
 */
export type SkFieldElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  required: boolean
  disabled: boolean
}

export const Field = defineComponent({
  name: "SkField",
  props: {
    /** Label text. Becomes the accessible name of the control inside. */
    label: optionalProp<string>(String),
    /** Persistent helper text, announced through `aria-describedby`. */
    description: optionalProp<string>(String),
    /** The validation message. Its presence drives `aria-invalid`. */
    error: optionalProp<string>(String),
    /** Marks the field invalid independently of whether `error` is set. */
    invalid: optionalProp<boolean>(Boolean),
    /** Marks the field required. Announced on the control. */
    required: optionalProp<boolean>(Boolean),
    /** Announces the field as disabled. Does not disable the control. */
    disabled: optionalProp<boolean>(Boolean),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkFieldElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-field",
        {
          ref: el,
          ...elementProps({
            label: props.label,
            description: props.description,
            error: props.error,
            invalid: props.invalid,
            required: props.required,
            disabled: props.disabled,
          }),
        },
        slots.default?.(),
      )
  },
})

export type FieldProps = {
  label: string
  description?: string
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
}
