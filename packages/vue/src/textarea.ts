import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Textarea — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The id is generated with `useId()` for the same reason as `Input`, and
 * `minLength`/`maxLength` are properties for the same reason — see the note
 * there. (`sk-textarea` observes the native lowercase `minlength` while
 * `sk-input` observes `min-length`; the property spelling is the one that is
 * correct for both, which is why this adapter never writes the attribute.)
 */
export type SkTextareaElement = HTMLElement & {
  rows: number
  cols?: number
  variant: "default" | "quiet"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
  placeholder: string
  form: string | undefined
  value: string
  defaultValue: string
  minLength?: number
  maxLength?: number
}

export const Textarea = defineComponent({
  name: "SkTextarea",
  props: {
    /** Visible rows. The browser's own sizing, not a pixel value. */
    rows: optionalProp<number>(Number),
    /** Visible columns, for the few cases where it matters. */
    cols: optionalProp<number>(Number),
    /** Visual emphasis. */
    variant: optionalProp<"default" | "quiet">(String),

    /** The control's label, associated with it programmatically. */
    label: optionalProp<string>(String),
    /** Persistent helper text below the field. */
    description: optionalProp<string>(String),
    /** The validation message. Its presence drives `aria-invalid`. */
    error: optionalProp<string>(String),
    /** Marks the field invalid independently of any error text. */
    invalid: optionalProp<boolean>(Boolean),

    /** Disabled: not submitted, not focusable. Mirrors the ARIA name. */
    disabled: optionalProp<boolean>(Boolean),
    /** Read-only: not editable, but still submitted and focusable. */
    readOnly: optionalProp<boolean>(Boolean),
    /** Native constraint validation; never suppressed. */
    required: optionalProp<boolean>(Boolean),

    /** The field's name in the form submission. See `Input` for why it is an attribute. */
    name: optionalProp<string>(String),
    /** Controlled value. Omit for an uncontrolled field. */
    value: optionalProp<string>(String),
    /** Initial value for an uncontrolled field. */
    defaultValue: optionalProp<string>(String),
    /** Reported as `tooShort` validity; not enforced while typing. */
    minLength: optionalProp<number>(Number),
    /** Enforced by the browser: input past it is refused. */
    maxLength: optionalProp<number>(Number),
    placeholder: optionalProp<string>(String),
    /** Associates the control with a form it is not nested inside. */
    form: optionalProp<string>(String),
    /** Explicit id, required under SSR when a `Label` targets this control. */
    id: optionalProp<string>(String),

    /** Fired for user-initiated changes only, never for a programmatic update. */
    onValueChange: optionalProp<(value: string) => void>(Function),
  },
  setup(props, { emit, expose }) {
    const el = ref<SkTextareaElement | null>(null)
    expose(elementProxy(el))
    const generatedId = useId()

    return () =>
      h("sk-textarea", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          rows: props.rows,
          cols: props.cols,
          variant: props.variant,
          label: props.label,
          description: props.description,
          error: props.error,
          invalid: props.invalid,
          disabled: props.disabled,
          readOnly: props.readOnly,
          required: props.required,
          name: props.name,
          value: props.value,
          defaultValue: props.defaultValue,
          minLength: props.minLength,
          maxLength: props.maxLength,
          placeholder: props.placeholder,
          form: props.form,
        }),
        onSkValueChange: (event: Event) => {
          const value = (event as CustomEvent<{ value: string }>).detail.value
          props.onValueChange?.(value)
          emit("update:value", value)
        },
      })
  },
})

export type TextareaProps = {
  rows?: number
  cols?: number
  variant?: "default" | "quiet"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  value?: string
  defaultValue?: string
  minLength?: number
  maxLength?: number
  placeholder?: string
  form?: string
  id?: string
  onValueChange?: (value: string) => void
}
