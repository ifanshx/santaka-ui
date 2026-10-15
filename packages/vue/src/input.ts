import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Input — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props, so
 * the FACE implementation, native validation, `setValidity`, and the reset and
 * disabled callbacks are all owned by `@santaka-ui/web-components`.
 *
 * Two things this adapter does that the element cannot, and one it deliberately
 * does differently from the React adapter:
 *
 *   - It generates the fallback `id` with Vue's `useId()`. Section 4 requires a
 *     component to generate an id when the consumer supplies none, and Vue's id
 *     space differs from the Web Components counter — which is why an SSR
 *     consumer must pass an explicit `id` when a separately-rendered `Label` has
 *     to find the control.
 *   - `minLength` and `maxLength` are written as **properties**, so their names
 *     are the camelCase prop names. That is not a style choice. Measured in
 *     Chromium (`e2e` probe, this repo): the host attribute for `sk-input` is
 *     `min-length`, so an adapter that wrote the native lowercase `minlength`
 *     would set an attribute the element never observes and the constraint would
 *     silently do nothing. Vue's `key in element` check assigns the property
 *     here, and the property is the spelling that always works.
 */
export type InputType = "text" | "email" | "password" | "search" | "tel" | "url" | "number"

/** The element Stencil generates for `<sk-input>`. */
export type SkInputElement = HTMLElement & {
  type: InputType
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
  value: string
  defaultValue: string
  autocomplete?: string
  placeholder: string
  form?: string
  minLength?: number
  maxLength?: number
  pattern: string
}

export const Input = defineComponent({
  name: "SkInput",
  props: {
    /** Native input type. */
    type: optionalProp<InputType>(String),
    /** Visual emphasis. */
    variant: optionalProp<"default" | "quiet">(String),
    /** Control height. */
    size: optionalProp<"sm" | "md" | "lg">(String),

    /** The control's label, rendered above the field and associated with it. */
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

    /**
     * The field's name in the form submission.
     *
     * The element is form-associated but has no `name` prop, so the platform
     * reads the host **attribute**. Vue writes it as an attribute because
     * `"name" in element` is false, which is exactly what is needed; without it
     * the control renders and validates and then contributes nothing to
     * `FormData`.
     */
    name: optionalProp<string>(String),
    /** Controlled value. Omit for an uncontrolled field. */
    value: optionalProp<string>(String),
    /** Initial value for an uncontrolled field. */
    defaultValue: optionalProp<string>(String),
    /** Native constraint validation; never suppressed. */
    minLength: optionalProp<number>(Number),
    /** Native constraint validation; never suppressed. */
    maxLength: optionalProp<number>(Number),
    /** A regular expression the value must match, as a native attribute string. */
    pattern: optionalProp<string>(String),
    placeholder: optionalProp<string>(String),
    autocomplete: optionalProp<string>(String),
    /** Associates the control with a form it is not nested inside. */
    form: optionalProp<string>(String),
    /** Explicit id, required under SSR when a `Label` targets this control. */
    id: optionalProp<string>(String),

    /** Fired for user-initiated changes only, never for a programmatic update. */
    onValueChange: optionalProp<(value: string) => void>(Function),
  },
  setup(props, { emit, expose }) {
    const el = ref<SkInputElement | null>(null)
    expose(elementProxy(el))

    // Vue's `useId()` (3.5+), the framework-native stable id. It is *not* the
    // same string the element's own counter would produce, which is the
    // documented reason an SSR consumer passes an explicit `id`.
    const generatedId = useId()

    return () =>
      h("sk-input", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          type: props.type,
          variant: props.variant,
          size: props.size,
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
          pattern: props.pattern,
          placeholder: props.placeholder,
          autocomplete: props.autocomplete,
          form: props.form,
        }),
        // `onSkValueChange` is `on` + the camelCase event name. Vue's
        // `isOn` requires an uppercase third character, so this wires a real
        // listener on `sk-value-change` — the opposite of React's rule, where
        // only the literal lowercase `onsk-value-change` is a listener.
        onSkValueChange: (event: Event) => {
          const value = (event as CustomEvent<{ value: string }>).detail.value
          props.onValueChange?.(value)
          // Also emitted as `update:value` so `v-model:value` works. The
          // native `sk-value-change` event stays the single source of truth;
          // this is the Vue spelling of the same fact.
          emit("update:value", value)
        },
      })
  },
})

export type InputProps = {
  type?: InputType
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
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
  pattern?: string
  placeholder?: string
  autocomplete?: string
  form?: string
  id?: string
  onValueChange?: (value: string) => void
}
