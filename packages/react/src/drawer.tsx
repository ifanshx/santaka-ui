import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Drawer - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The trigger and the panel content are children, not props: the element owns the
 * focus story, so an adapter that tried to manage open state in React would be a
 * second owner of the same ephemeral state — which §4 reserves for the component
 * ("open/closed is owned outright, and there is no `defaultOpen`").
 *
 * `side` is logical only. There is no `left`/`right` here because there is none
 * on the element: ADR-016 bans physical edges in component CSS, and a fixed edge
 * is what puts a drawer on the wrong side of a right-to-left document.
 */
export type SkDrawerElement = HTMLElement & {
  open: boolean
  side: "start" | "end"
  modal: boolean
  dismissible: boolean
  label: string
}

export type DrawerProps = {
  /** Which edge it slides from. Logical, so it mirrors under `dir="rtl"`. */
  side?: "start" | "end"
  /** Modal traps focus and makes the page behind inert. */
  modal?: boolean
  /** Closes when the backdrop is clicked. */
  dismissible?: boolean
  /** Accessible name, needed when there is no visible heading. */
  label?: string
  className?: string
  /** The trigger (`slot="trigger"`) and the panel content. */
  children?: ReactNode
}

export const Drawer = forwardRef<SkDrawerElement, DrawerProps>(function Drawer(
  { side, modal, dismissible, label, className, children },
  ref,
): ReactElement {
  return (
    <sk-drawer
      ref={ref}
      class={cn(className)}
      side={side}
      modal={modal}
      dismissible={dismissible}
      label={label}
    >
      {children}
    </sk-drawer>
  )
})
