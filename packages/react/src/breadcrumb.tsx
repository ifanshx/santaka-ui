import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/** One entry in the trail. The last one is the current page. */
export type Crumb = { label: string; href?: string }

/**
 * Breadcrumb - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The trail is an array rather than children, for the reason the element
 * records: it has to know which entry is last, which is what `aria-current`
 * hangs off — and a slot cannot tell you how many nodes it received without
 * walking them at runtime.
 */
export type SkBreadcrumbElement = HTMLElement & {
  items: string | Crumb[]
  label: string
}

export type BreadcrumbProps = {
  /** The trail, oldest first. The last entry is the current page. */
  items: Crumb[]
  /** Accessible name for the landmark. */
  label?: string
  className?: string
}

export const Breadcrumb = forwardRef<SkBreadcrumbElement, BreadcrumbProps>(function Breadcrumb(
  { items, label, className },
  ref,
): ReactElement {
  return <sk-breadcrumb ref={ref} class={cn(className)} items={items} label={label} />
})
