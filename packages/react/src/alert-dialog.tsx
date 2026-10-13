import { forwardRef, useCallback, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * AlertDialog - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The parts follow the Dialog's compound naming: `AlertDialog` and
 * `AlertDialogContent` over slot attributes. There is no `AlertDialogTrigger` —
 * an alert is raised by the application in response to something, never opened
 * by the user browsing.
 */
export type SkAlertDialogElement = HTMLElement & {
  open: boolean
  label: string
  initialFocus: string
}

export type AlertDialogContentProps = {
  title?: ReactNode
  className?: string
  children?: ReactNode
}

export function AlertDialogContent({
  title,
  className,
  children,
}: AlertDialogContentProps): ReactElement {
  return (
    <>
      {title ? (
        <span slot="title" className={cn(className)}>
          {title}
        </span>
      ) : null}
      {children}
    </>
  )
}

export type AlertDialogProps = {
  open?: boolean
  /**
   * Accessible name. An interruption that announces nothing is a modal
   * mystery — prefer a real heading in the title slot.
   */
  label?: string
  /** Selector for the control receiving initial focus — the default action. */
  initialFocus?: string
  className?: string
  children?: ReactNode
  /** Fires on every close, which only ever follows a decision. */
  onOpenChange?: (open: boolean) => void
}

export const AlertDialog = forwardRef<SkAlertDialogElement, AlertDialogProps>(function AlertDialog(
  { open, label, initialFocus, className, children, onOpenChange },
  ref,
): ReactElement {
  const panelRef = useCallback(
    (element: SkAlertDialogElement | null) => {
      if (!element) return
      if (typeof ref === "function") ref(element)
      else if (ref) ref.current = element

      if (!onOpenChange) return
      element.addEventListener("sk-open-change", (event) => {
        onOpenChange((event as CustomEvent<{ open: boolean }>).detail.open)
      })
    },
    [onOpenChange, ref],
  )

  return (
    <sk-alert-dialog
      ref={panelRef}
      class={cn(className)}
      open={open}
      label={label}
      initial-focus={initialFocus}
    >
      {children}
    </sk-alert-dialog>
  )
})
