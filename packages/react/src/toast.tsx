import { forwardRef, useCallback, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Toast - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A toast is announced when it appears and must not steal focus, so the
 * adapter renders no focusable wrapper: the message goes in the default slot,
 * and the close button lives inside the component.
 */
export type SkToastElement = HTMLElement & {
  open: boolean
  duration: number
  variant: "neutral" | "success" | "warning" | "danger"
}

export type ToastProps = {
  open?: boolean
  /** Milliseconds before auto-dismiss. `0` never expires. */
  duration?: number
  /** Severity, drawn as a 3px left edge plus the message text. */
  variant?: "neutral" | "success" | "warning" | "danger"
  className?: string
  children?: ReactNode
  /** Fires on dismiss, whether by clock, button, or consumer. */
  onDismiss?: () => void
}

export const Toast = forwardRef<SkToastElement, ToastProps>(function Toast(
  { open, duration, variant, className, children, onDismiss },
  ref,
): ReactElement {
  const panelRef = useCallback(
    (element: SkToastElement | null) => {
      if (!element) return
      if (typeof ref === "function") ref(element)
      else if (ref) ref.current = element

      if (!onDismiss) return
      element.addEventListener("sk-open-change", (event) => {
        if (!(event as CustomEvent<{ open: boolean }>).detail.open) onDismiss()
      })
    },
    [onDismiss, ref],
  )

  return (
    <sk-toast
      ref={panelRef}
      class={cn(className)}
      open={open}
      duration={duration}
      variant={variant}
    >
      {children}
    </sk-toast>
  )
})
