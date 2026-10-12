import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Badge — React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A badge is a static label, so this adapter is thin by construction: it maps
 * props onto the custom element and forwards children into its slot. There is no
 * state to own, which is why the registry entry for this component warns that a
 * clickable badge is a Button with extra steps.
 */
export type SkBadgeElement = HTMLElement & {
  variant: BadgeVariant
  size: BadgeSize
  dot: boolean
  statusLabel: string
}

/**
 * Visual emphasis. `neutral` is the default because a badge with no stated
 * emphasis is the common case, and it is the one that reads as chrome rather than
 * as state.
 */
export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger"

/** Control height. */
export type BadgeSize = "sm" | "md"

export type BadgeProps = {
  /** Visual emphasis. */
  variant?: BadgeVariant
  /** Control height. */
  size?: BadgeSize
  /**
   * Renders the badge as a dot instead of a pill.
   *
   * Required by the type when `dot` is set, and for the same reason the
   * component requires it at runtime: a dot conveys state by color alone, which
   * WCAG 1.4.1 forbids. The consumer supplies `statusLabel`, which renders
   * visually hidden so the state is announced.
   */
  dot?: boolean
  /**
   * Screen-reader text for the dot variant.
   *
   * Required by the type when `dot` is set, and for the same reason the
   * component requires it at runtime: a dot conveys state by color alone, which
   * WCAG 1.4.1 forbids. The consumer supplies `statusLabel`, which renders
   * visually hidden so the state is announced.
   */
  statusLabel?: string
  className?: string
  children?: ReactNode
}

export type DotBadgeProps = BadgeProps & { dot: true; statusLabel: string }

/**
 * The dot variant and its label are required together, in the type system.
 *
 * The alternative — both optional, as the custom element declares them — would
 * let a consumer ship `<Badge dot />` with no accessible name, which is the exact
 * WCAG 1.4.1 failure the component documents. Overloading on `dot: true` lets the
 * compiler catch it while the ordinary badge stays ergonomic.
 */
export const Badge = forwardRef<SkBadgeElement, BadgeProps | DotBadgeProps>(function Badge(
  { variant, size, dot, statusLabel, className, children }: BadgeProps | DotBadgeProps,
  ref,
): ReactElement {
  return (
    <sk-badge
      ref={ref}
      class={cn(className)}
      variant={variant}
      size={size}
      dot={dot}
      status-label={statusLabel}
    >
      {children}
    </sk-badge>
  )
})
