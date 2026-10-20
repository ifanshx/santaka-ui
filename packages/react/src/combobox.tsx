import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Combobox - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Thin by construction, and one thing is worth naming: there is no `onChange`
 * prop. The component emits `sk-value-change` only for a committed selection —
 * typing filters and is not a value change (§4). A React consumer who wants to
 * observe edits listens for `input` on the field; the component's event is the
 * committed value, and conflating the two is what makes a combobox fire on every
 * keystroke.
 */
export type SkComboboxElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  name: string
  placeholder: string
  options: string | Array<{ value: string; label: string }>
  value: string
}

/** One option in the list. */
export type ComboOption = { value: string; label: string }

export type ComboboxProps = {
  /** The accessible name, and the label rendered above the field. */
  label?: string
  /** Persistent helper text. */
  description?: string
  /** The validation message. Its presence drives `aria-invalid`. */
  error?: string
  /** Marks the field invalid independently of whether `error` is set. */
  invalid?: boolean
  /** Disables the control. */
  disabled?: boolean
  /** Native form semantics. */
  name?: string
  /** Placeholder. Never a substitute for a label. */
  placeholder?: string
  /** The options to filter. */
  options?: ComboOption[]
  /** The selected value. */
  value?: string
  className?: string
}

export const Combobox = forwardRef<SkComboboxElement, ComboboxProps>(function Combobox(
  { label, description, error, invalid, disabled, name, placeholder, options, value, className },
  ref,
): ReactElement {
  return (
    <sk-combobox
      ref={ref}
      class={cn(className)}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      name={name}
      placeholder={placeholder}
      options={options}
      value={value}
    />
  )
})
