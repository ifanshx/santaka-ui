import { forwardRef, useId, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * RadioGroup — React adapter for the `<sk-radio-group>` web component.
 *
 * An exclusive choice from a small set, rendered as real native radios so the
 * browser owns arrow-key navigation, the single tab stop, and constraint
 * validation. The group owns `name` and `required`; the checked radio's value
 * is what a plain form submits.
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
  options: RadioOption[]
  variant: RadioGroupVariant
  size: RadioGroupSize
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  name: string
  value: string
  /** Fired when the user selects an option. */
  onValueChange: ((value: string) => void) | undefined
}

export type RadioGroupProps = {
  /** The choices. Passed as a property, serialized to JSON for the element. */
  options: RadioOption[]
  /** Visual emphasis. */
  variant?: RadioGroupVariant
  /** Label text size. The row target stays 44px at every size. */
  size?: RadioGroupSize
  /** The group's own label text, rendered above the options. */
  label?: string
  /** Persistent helper text below the group. */
  description?: string
  /** The validation message. Its presence drives `aria-invalid`. */
  error?: string
  /** Marks the field invalid, with the same independence from `error` as Input. */
  invalid?: boolean
  /** Disables interaction. Mirrors the ARIA name. */
  disabled?: boolean
  /** Native constraint validation still applies and is never suppressed. */
  required?: boolean
  /** Associates the control with a form it is not nested inside. */
  form?: string
  /** The submitted name. Every radio in the group carries it. */
  name: string
  /** The value. Uncontrolled by default; omit for nothing selected. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Called when the user selects an option. */
  onValueChange?: (value: string) => void
  /** Optional HTML id. If omitted, a stable id is generated. */
  id?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * The generated id follows React's `useId()` so it is stable across renders
 * and unique within the tree, which is what the element needs to name the
 * group container through `aria-labelledby`.
 */
export const RadioGroup = forwardRef<SkRadioGroupElement, RadioGroupProps>(function RadioGroup(
  {
    options,
    variant = "default",
    size = "md",
    label = "",
    description = "",
    error = "",
    invalid = false,
    disabled = false,
    required = false,
    form,
    name,
    value,
    defaultValue,
    onValueChange,
    id: providedId,
    className,
  },
  ref,
): ReactElement {
  const generatedId = useId()
  const id = providedId ?? generatedId

  const handleChange = (e: Event) => {
    // The event arrives from the custom element host, not the inner radio, so
    // the payload is `detail` — the same contract Input and Select adapt.
    const detail = (e as CustomEvent<{ value: string }>).detail
    onValueChange?.(detail.value)
  }

  return (
    <sk-radio-group
      ref={ref}
      id={id}
      // Serialized: the element parses it once, not on every render. Same
      // contract as Select, whose options take the identical path.
      options={options ? JSON.stringify(options) : undefined}
      variant={variant}
      size={size}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      required={required}
      form={form}
      name={name}
      value={value ?? undefined}
      defaultValue={defaultValue}
      onsk-value-change={handleChange}
      class={cn(className)}
    />
  )
})
