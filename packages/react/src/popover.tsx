import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Popover - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The trigger and the panel content are children, not props. That is the
 * component's design: it owns the focus story, so an adapter that tried to
 * manage open state in React would be a second owner of the same ephemeral
 * state, which §4 reserves for the component.
 *
 * `slot="trigger"` must sit on a real DOM element rather than on another
 * adapter — slot assignment is the browser's, and a React component prop would
 * not reach the attribute that does it.
 */
export type SkPopoverElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "start" | "end"
  label: string
}

export type PopoverProps = {
  /**
   * Preferred side. Flips at the viewport edge rather than clipping. `start` and
   * `end` are logical and mirror under `dir="rtl"`.
   */
  placement?: "top" | "bottom" | "start" | "end"
  /** Accessible name for the panel, needed when there is no visible heading. */
  label?: string
  className?: string
  /** The trigger and the panel content. */
  children?: ReactNode
}

export const Popover = forwardRef<SkPopoverElement, PopoverProps>(function Popover(
  { placement, label, className, children },
  ref,
): ReactElement {
  return (
    <sk-popover ref={ref} class={cn(className)} placement={placement} label={label}>
      {children}
    </sk-popover>
  )
})
