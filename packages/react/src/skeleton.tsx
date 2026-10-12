import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Skeleton - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * No `children` prop, matching the component: a skeleton's children are always
 * nothing, and real content replaces the element. A type that accepted children
 * would let a consumer nest content inside the scaffolding it exists to replace.
 */
export type SkSkeletonElement = HTMLElement & {
  variant: "text" | "rect" | "circle"
  direction: "ltr" | "rtl"
}

export type SkeletonProps = {
  /** The shape being promised. `text` tracks the body line height by default. */
  variant?: "text" | "rect" | "circle"
  /** Shimmer direction. Set it for a right-to-left reading context. */
  direction?: "ltr" | "rtl"
  className?: string
}

export const Skeleton = forwardRef<SkSkeletonElement, SkeletonProps>(function Skeleton(
  { variant, direction, className },
  ref,
): ReactElement {
  return <sk-skeleton ref={ref} class={cn(className)} variant={variant} direction={direction} />
})
