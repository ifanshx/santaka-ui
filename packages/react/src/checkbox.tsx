import { forwardRef, useId, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Checkbox — React adapter for the `<sk-checkbox>` web component.
 *
 * The component wraps a native `<input type="checkbox">` styled with the
 * brutalist design system. It follows the Input contract on a boolean: FACE
 * with all three callbacks, native constraint validation through `required`,
 * label/description/error wiring, and `sk-value-change` only for
 * user-initiated changes.
 *
 * The label wraps the input, making the whole row the activation target
 * without a click handler — the browser's own label activation toggles it.
 *
 * `indeterminate` is visual state, not form state: an indeterminate checkbox
 * submits as unchecked (`null`), which is what the platform does.
 */
export type CheckboxSize = "sm" | "md" | "lg"
export type CheckboxVariant = "default" | "quiet"

/** The element Stencil generates for `<sk-checkbox>`. */
export type SkCheckboxElement = HTMLElement & {
  variant: CheckboxVariant
  size: CheckboxSize
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  /** The field's name in the form submission. */
  name: string | undefined
  checked: boolean
  indeterminate: boolean
  /** Fired when the user toggles the checkbox. */
  onValueChange: ((checked: boolean) => void) | undefined
}

export type CheckboxProps = {
  /** Visual emphasis. */
  variant?: CheckboxVariant
  /** Label text size. The row target stays 44px at every size. */
  size?: CheckboxSize
  /** The label text, rendered beside the box. Wraps the control. */
  label: string
  /** Persistent helper text below the row. */
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
  /**
   * The field's name in the form submission.
   *
   * The custom element reads `name` off its own host attribute — that is how a
   * form-associated element is identified to the platform — so this adapter has
   * to forward it. Without it the control renders, validates, and reports its
   * value, and then contributes **nothing** to `FormData`: the element is
   * form-associated but unnamed, and an unnamed control is not submitted.
   */
  name?: string
  /** Whether the box is checked. An ARIA-mirroring boolean (ADR-013). */
  checked?: boolean
  /** Uncontrolled initial checked state. */
  defaultChecked?: boolean
  /**
   * The value submitted when the box is checked.
   *
   * The custom element has always carried this — `"on"` is the platform default,
   * so a plain form reads what a native checkbox would send. This adapter simply
   * did not forward it, which made the element's own `value` unreachable from
   * React: a consumer could set the label and the name and still not choose what
   * the form received. Switch has forwarded its `value` all along; this is the
   * same prop for the same reason.
   */
  value?: string
  /** Visual "some children" state. Property-only — submits as unchecked. */
  indeterminate?: boolean
  /** Called when the user toggles the checkbox. */
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
export const Checkbox = forwardRef<SkCheckboxElement, CheckboxProps>(function Checkbox(
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
    name,
    checked,
    defaultChecked = false,
    value = "on",
    indeterminate = false,
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
    <sk-checkbox
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
      name={name}
      checked={checked ?? undefined}
      defaultChecked={defaultChecked}
      value={value}
      indeterminate={indeterminate}
      onsk-value-change={handleChange}
      class={cn(className)}
    />
  )
})

/** Re-exported so a consumer can type their own handler without importing React. */
export type { ChangeEvent } from "react"
