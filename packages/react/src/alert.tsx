import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Alert - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props.
 *
 * An alert is chrome, not an overlay, so there is nothing to disentangle about
 * where it lives: children land in the default slot, the browser assigns them,
 * and the component picks its live-region role from the variant on its own.
 */
export type SkAlertElement = HTMLElement & {
  variant: AlertVariant
  heading: string
}

/**
 * Visual emphasis. `neutral` is the default because an alert with no stated
 * severity is the common case.
 */
export type AlertVariant = "neutral" | "primary" | "success" | "warning" | "danger"

export type AlertProps = {
  /** Visual emphasis. Also picks the default live-region role. */
  variant?: AlertVariant
  /**
   * Heading text, rendered as a `<span>`. Named `heading`, not `title`, for
   * the reason the custom element records: `title` is a standardized
   * `HTMLElement` member and would surface as a hover tooltip.
   */
  heading?: string
  className?: string
  /** Body content of the alert. */
  children?: ReactNode
}

export const Alert = forwardRef<SkAlertElement, AlertProps>(function Alert(
  { variant, heading, className, children },
  ref,
): ReactElement {
  return (
    <sk-alert ref={ref} class={cn(className)} variant={variant} heading={heading}>
      {children}
    </sk-alert>
  )
})
