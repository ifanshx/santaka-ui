import { forwardRef, useId, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Textarea — React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props, so
 * the FACE implementation, native validation, and the reset and disabled
 * callbacks are all owned by `@santaka-ui/web-components`.
 *
 * The id is generated with `useId()` for the same reason as `Input`: section 4
 * requires it, and the two id spaces deliberately disagree, which is why an SSR
 * consumer must pass an explicit `id` when a separately-rendered `Label` has to
 * find the control.
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
  value: string
  defaultValue: string
  minLength?: number
  maxLength?: number
}

export type TextareaProps = {
  /** Visible rows. The browser's own sizing, not a pixel value. */
  rows?: number
  /** Visible columns, for the few cases where it matters. */
  cols?: number
  /** Visual emphasis. */
  variant?: "default" | "quiet"

  /** The control's label, associated with it programmatically. */
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
  /** Reported as `tooShort` validity; not enforced while typing. */
  minLength?: number
  /** Enforced by the browser: input past it is refused. */
  maxLength?: number
  placeholder?: string
  /** Associates the control with a form it is not nested inside. */
  form?: string
  /** Explicit id, required under SSR when a `Label` targets this control. */
  id?: string

  className?: string
  /** Fired for user-initiated changes only, never for a programmatic update. */
  onValueChange?: (value: string) => void
}

export const Textarea = forwardRef<SkTextareaElement, TextareaProps>(function Textarea(
  {
    rows,
    cols,
    variant,
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
    placeholder,
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
    <sk-textarea
      ref={ref}
      class={cn(className)}
      id={controlId}
      rows={rows}
      cols={cols}
      variant={variant}
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
      placeholder={placeholder}
      form={form}
      {...{
        // React's rule for a custom element's event prop is the literal lowercase
        // `on` followed by the dashed event name: `sk-value-change` becomes
        // `onsk-value-change`. The camelCase form is lowercased to a different
        // prop and set as an attribute rather than wired as a listener.
        "onsk-value-change": (event: CustomEvent<{ value: string }>) => {
          onValueChange?.(event.detail.value)
        },
      }}
    />
  )
})
