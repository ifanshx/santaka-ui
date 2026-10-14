import { forwardRef, useId, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Switch — React adapter for the `<sk-switch>` web component.
 *
 * An on/off control rendered as a native checkbox carrying `role="switch"`:
 * the browser keeps validation and form submission, assistive technology
 * reads the state as on/off. The contract is the Checkbox contract; the
 * distinction is when it applies — a switch acts immediately, a checkbox is
 * collected for a later submit.
 */
export type SwitchSize = "sm" | "md" | "lg"
export type SwitchVariant = "default" | "quiet"

/** The element Stencil generates for `<sk-switch>`. */
export type SkSwitchElement = HTMLElement & {
  variant: SwitchVariant
  size: SwitchSize
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  checked: boolean
  defaultChecked: boolean
  /** Fired when the user toggles the switch. */
  onValueChange: ((checked: boolean) => void) | undefined
}

export type SwitchProps = {
  /** Visual emphasis. */
  variant?: SwitchVariant
  /** Label text size. The row target stays 44px at every size. */
  size?: SwitchSize
  /** The label text, rendered beside the track. Wraps the control. */
  label: string
  /** Persistent helper text below the row. */
  description?: string
  /** The validation message. Its presence drives `aria-invalid`. */
  error?: string
  /** Marks the field invalid, with the same independence from `error` as Checkbox. */
  invalid?: boolean
  /** Disables interaction. Mirrors the ARIA name. */
  disabled?: boolean
  /** Native constraint validation still applies and is never suppressed. */
  required?: boolean
  /** Associates the control with a form it is not nested inside. */
  form?: string
  /** Whether the switch is on. An ARIA-mirroring boolean (ADR-013). */
  checked?: boolean
  /** Uncontrolled initial state. */
  defaultChecked?: boolean
  /** The submitted value when on. */
  value?: string
  /** Called when the user toggles the switch. */
  onValueChange?: (checked: boolean) => void
  /** Optional HTML id. If omitted, a stable id is generated. */
  id?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * The generated id follows React's `useId()` so it is stable across renders
 * and unique within the tree, which is what the element needs to associate
 * its own `<label>` and to reference its description and error elements.
 */
export const Switch = forwardRef<SkSwitchElement, SwitchProps>(function Switch(
  {
    variant = "default",
    size = "md",
    label,
    description = "",
    error = "",
    invalid = false,
    disabled = false,
    required = false,
    form,
    checked,
    defaultChecked = false,
    value = "on",
    onValueChange,
    id: providedId,
    className,
  },
  ref,
): ReactElement {
  const generatedId = useId()
  const id = providedId ?? generatedId

  const handleChange = (e: Event) => {
    // The event arrives from the custom element host, not the inner input, so
    // the payload is `detail` — the same contract Input and Select adapt.
    const detail = (e as CustomEvent<{ checked: boolean }>).detail
    onValueChange?.(detail.checked)
  }

  return (
    <sk-switch
      ref={ref}
      id={id}
      variant={variant}
      size={size}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      required={required}
      form={form}
      checked={checked ?? undefined}
      defaultChecked={defaultChecked}
      value={value}
      onsk-value-change={handleChange}
      class={cn(className)}
    />
  )
})
