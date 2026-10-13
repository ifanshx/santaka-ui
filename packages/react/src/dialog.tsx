import { forwardRef, useCallback, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Dialog - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Compound naming follows §4: the flat exports are `Dialog`, `DialogTrigger`,
 * and `DialogContent`, and a namespace object is also exported. The web
 * component uses named slots per the same section, so the React parts are
 * conveniences over `slot` attributes — `DialogTrigger` renders a Button with
 * `slot="trigger"`, and `DialogContent` is the fragment that receives
 * everything else.
 *
 * Open/close is the component's state; the adapter observes `sk-open-change`
 * and hands the value to `onOpenChange`. There is no `defaultOpen`, per §4's
 * state-ownership rule.
 */
export type SkDialogElement = HTMLElement & {
  open: boolean
  modal: boolean
  dismissible: boolean
  label: string
}

export type DialogTriggerProps = {
  className?: string
  children?: ReactNode
}

export function DialogTrigger({ className, children }: DialogTriggerProps): ReactElement {
  return (
    <span slot="trigger" className={cn(className)}>
      {children}
    </span>
  )
}

export type DialogContentProps = {
  /** Rendered in the `title` slot; a real heading doubles as the dialog's name. */
  title?: ReactNode
  className?: string
  children?: ReactNode
}

export function DialogContent({ title, className, children }: DialogContentProps): ReactElement {
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

export type DialogProps = {
  /** Controlled open state. Omit for uncontrolled; the trigger drives it. */
  open?: boolean
  /** Non-modal renders inline without blocking the page. */
  modal?: boolean
  /** Closes when the backdrop is clicked. Off by default: dialogs holding form input lose work to a stray click. */
  dismissible?: boolean
  /** Accessible name when no slotted heading exists. */
  label?: string
  className?: string
  children?: ReactNode
  /** Fires for user interaction in both controlled and uncontrolled modes. */
  onOpenChange?: (open: boolean) => void
}

export const Dialog = forwardRef<SkDialogElement, DialogProps>(function Dialog(
  { open, modal, dismissible, label, className, children, onOpenChange },
  ref,
): ReactElement {
  // The event is subscribed imperatively: React's synthetic system does not
  // know the custom event name, and a lowercase `onsk-open-change` attribute
  // would set a property, not a listener.
  const panelRef = useCallback(
    (element: SkDialogElement | null) => {
      if (!element) return
      if (typeof ref === "function") ref(element)
      else if (ref) ref.current = element

      if (!onOpenChange) return
      const listener = (event: Event) => {
        onOpenChange((event as CustomEvent<{ open: boolean }>).detail.open)
      }
      element.addEventListener("sk-open-change", listener)
    },
    [onOpenChange, ref],
  )

  return (
    <sk-dialog
      ref={panelRef}
      class={cn(className)}
      open={open}
      modal={modal}
      dismissible={dismissible}
      label={label}
    >
      {children}
    </sk-dialog>
  )
})
