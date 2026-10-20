import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Field - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The control is **children**, not a prop. That is the component's whole design:
 * it labels and describes a control the consumer already has — a plain
 * `<input>`, a third-party widget, or several controls under one label — so an
 * adapter that took a `control` prop would reintroduce the ownership the element
 * deliberately refuses.
 *
 * `label` is required by the type: a field with no label has nothing to
 * associate and nothing to announce, so it would be a box around a control with
 * no accessible name added.
 */
export type SkFieldElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  required: boolean
  disabled: boolean
}

export type FieldProps = {
  /** Label text. Becomes the accessible name of the control inside. */
  label: string
  /** Persistent helper text, announced through `aria-describedby`. */
  description?: string
  /** The validation message. Its presence drives `aria-invalid`. */
  error?: string
  /** Marks the field invalid independently of whether `error` is set. */
  invalid?: boolean
  /** Marks the field required. Announced on the control. */
  required?: boolean
  /** Announces the field as disabled. Does not disable the control. */
  disabled?: boolean
  className?: string
  /** The control — any element. The field adds ARIA wiring and nothing else. */
  children?: ReactNode
}

export const Field = forwardRef<SkFieldElement, FieldProps>(function Field(
  { label, description, error, invalid, required, disabled, className, children },
  ref,
): ReactElement {
  return (
    <sk-field
      ref={ref}
      class={cn(className)}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      required={required}
      disabled={disabled}
    >
      {children}
    </sk-field>
  )
})
