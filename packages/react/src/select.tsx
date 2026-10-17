import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Select - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Options arrive as objects and serialize to JSON for the element's attribute;
 * `defaultValue` maps to the element's `value` (the uncontrolled initial), and
 * `value` is the controlled write. The native `<select>` inside is visible —
 * §4's hidden-native path was rejected for this component, and the web
 * component's docs record why.
 */
export type SkSelectElement = HTMLElement & {
  options: Array<{ value: string; label: string; disabled?: boolean }>
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

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = {
  /** The choices, as objects; the adapter serializes them to JSON. */
  options?: SelectOption[]
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  /** Placeholder-style first choice, shown when the value is "". */
  placeholder?: string
  form?: string
  /**
   * The field's name in the form submission.
   *
   * Forwarded to the element host attribute, which is how the platform
   * identifies a form-associated control. Without it the select renders and
   * reports its value but contributes nothing to `FormData`.
   */
  name?: string
  /** The controlled value. */
  value?: string
  /** Initial value for the uncontrolled case. */
  defaultValue?: string
  /** Fires only for user-initiated changes, per section 4. */
  onValueChange?: (value: string) => void
  className?: string
}

export const Select = forwardRef<SkSelectElement, SelectProps>(function Select(
  {
    options,
    variant,
    size,
    label,
    description,
    error,
    invalid,
    disabled,
    required,
    placeholder,
    form,
    name,
    value,
    defaultValue,
    onValueChange,
    className,
  },
  ref,
): ReactElement {
  return (
    <sk-select
      ref={ref}
      class={cn(className)}
      // Serialized: the element parses it once, not on every render.
      options={options ? JSON.stringify(options) : undefined}
      variant={variant}
      size={size}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      form={form}
      name={name}
      value={value}
      default-value={defaultValue}
      onsk-value-change={
        onValueChange
          ? (event: CustomEvent<{ value: string }>) => {
              onValueChange(event.detail.value)
            }
          : undefined
      }
    />
  )
})
