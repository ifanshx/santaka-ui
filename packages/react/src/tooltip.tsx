import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Tooltip - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The compound parts follow the Dialog convention: `Tooltip` and
 * `TooltipTrigger` over slot attributes. The trigger must be a focusable
 * element — a non-interactive span gives keyboard users nothing to describe.
 */
export type SkTooltipElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "left" | "right"
  delay: number
}

export type TooltipTriggerProps = {
  className?: string
  children?: ReactNode
}

export function TooltipTrigger({ className, children }: TooltipTriggerProps): ReactElement {
  return (
    <span slot="trigger" className={cn(className)}>
      {children}
    </span>
  )
}

export type TooltipProps = {
  open?: boolean
  /** Preferred side. Flips at the viewport edge rather than clipping. */
  placement?: "top" | "bottom" | "left" | "right"
  /** Milliseconds of hover before showing. A tooltip that fires instantly is a strobe. */
  delay?: number
  className?: string
  children?: ReactNode
}

export const Tooltip = forwardRef<SkTooltipElement, TooltipProps>(function Tooltip(
  { open, placement, delay, className, children },
  ref,
): ReactElement {
  return (
    <sk-tooltip ref={ref} class={cn(className)} open={open} placement={placement} delay={delay}>
      {children}
    </sk-tooltip>
  )
})
