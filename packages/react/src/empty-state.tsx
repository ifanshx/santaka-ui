import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * EmptyState - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props.
 *
 * Slots work the way Card's comment records: React renders children into the
 * element's light DOM and the browser performs slot assignment, so a
 * `<div slot="icon">` or `<sk-button slot="actions">` lands where the custom
 * element put its named slot. No `Slot` component intervenes.
 */
export type SkEmptyStateElement = HTMLElement & {
  variant: EmptyStateVariant
  size: EmptyStateSize
  heading: string
  description: string
}

/**
 * Visual treatment. `bare` drops the surface chrome for an empty state nested
 * inside a card, where two competing boundaries would fight.
 */
export type EmptyStateVariant = "default" | "bare"

/** Density axis: block padding and glyph size. */
export type EmptyStateSize = "sm" | "md" | "lg"

export type EmptyStateProps = {
  /** Visual treatment. */
  variant?: EmptyStateVariant
  /** Density axis: block padding and glyph size. */
  size?: EmptyStateSize
  /** Plain text in a `<span>`, not a heading element. */
  heading?: string
  /** Supporting text under the heading. */
  description?: string
  className?: string
  /** Body content, plus `slot="icon"` and `slot="actions"` children. */
  children?: ReactNode
}

export const EmptyState = forwardRef<SkEmptyStateElement, EmptyStateProps>(function EmptyState(
  { variant, size, heading, description, className, children },
  ref,
): ReactElement {
  return (
    <sk-empty-state
      ref={ref}
      class={cn(className)}
      variant={variant}
      size={size}
      heading={heading}
      description={description}
    >
      {children}
    </sk-empty-state>
  )
})
