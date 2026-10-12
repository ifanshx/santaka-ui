import { forwardRef, useId, type ChangeEvent, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Input — React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props, so
 * the FACE implementation, native validation, `setValidity`, and the reset and
 * disabled callbacks are all owned by `@santaka-ui/web-components`.
 *
 * The one thing this adapter does that the custom element cannot is generate an
 * id. Section 4 requires React to use `useId()` and Web Components to use a
 * module-level counter, and the two id spaces deliberately do not agree — which
 * is why an SSR consumer must pass an explicit `id` when a separately-rendered
 * `Label` has to find the control.
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

export type InputProps = {
  /** Native input type. */
  type?: InputType
  /** Visual emphasis. */
  variant?: "default" | "quiet"
  /** Control height. */
  size?: "sm" | "md" | "lg"

  /** The control's label. Rendered above the field and associated with it. */
  label?: string
  /** Persistent helper text below the field. */
  description?: string
  /** The validation message. Its presence drives `aria-invalid`. */
  error?: string
  /** Marks the field invalid independently of any error text. */
  invalid?: boolean

  /** Disabled: not submitted, not focusable. Mirrors the ARIA name. */
  disabled?: boolean
  /** Read-only: not editable, but still submitted and focusable. */
  readOnly?: boolean
  /** Native constraint validation; never suppressed. */
  required?: boolean

  /** The field's name in the form submission. */
  name?: string
  /** Passed through to the element; omit for an uncontrolled field. */
  value?: string
  /** Initial value for an uncontrolled field. */
  defaultValue?: string
  /** Native constraint validation; never suppressed. */
  minLength?: number
  /** Native constraint validation; never suppressed. */
  maxLength?: number
  /** A regular expression the value must match, as a native attribute string. */
  pattern?: string
  placeholder?: string
  autocomplete?: string
  /** Associates the control with a form it is not nested inside. */
  form?: string
  /** Explicit id, required under SSR when a `Label` targets this control. */
  id?: string

  className?: string
  /** Fired for user-initiated changes only, never for a programmatic update. */
  onValueChange?: (value: string) => void
}

/**
 * The generated id follows React's `useId()` so it is stable across renders and
 * unique within the tree, which is what the element needs to associate its own
 * `<label>` and to reference its description and error elements.
 */
export const Input = forwardRef<SkInputElement, InputProps>(function Input(
  {
    type,
    variant,
    size,
    label,
    description,
    error,
    invalid,
    disabled,
    readOnly,
    required,
    name,
    value,
    defaultValue,
    minLength,
    maxLength,
    pattern,
    placeholder,
    autocomplete,
    form,
    id,
    className,
    onValueChange,
  },
  ref,
): ReactElement {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <sk-input
      ref={ref}
      class={cn(className)}
      id={controlId}
      type={type}
      variant={variant}
      size={size}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      readonly={readOnly}
      required={required}
      name={name}
      value={value}
      default-value={defaultValue}
      minlength={minLength}
      maxlength={maxLength}
      pattern={pattern}
      placeholder={placeholder}
      autocomplete={autocomplete}
      form={form}
      {...{
        // React's rule for a custom element's event prop is the literal lowercase
        // `on` followed by the dashed event name: `sk-value-change` becomes
        // `onsk-value-change`. The camelCase `onSkValueChange` is lowercased to
        // `onskvaluechange`, which is a different prop and is set as an attribute
        // rather than wired as a listener.
        "onsk-value-change": (event: CustomEvent<{ value: string }>) => {
          onValueChange?.(event.detail.value)
        },
      }}
    />
  )
})

/** Re-exported so a consumer can type their own handler without importing React. */
export type { ChangeEvent }
