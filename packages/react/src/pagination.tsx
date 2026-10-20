import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Pagination - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The window arithmetic — which page numbers to show and where the ellipses go —
 * stays in the element, so this adapter only forwards the two numbers that drive
 * it. A consumer who reimplemented the window in React would have two sources of
 * truth for the same thing.
 */
export type SkPaginationElement = HTMLElement & {
  count: number
  page: number
  siblings: number
  label: string
  href: string
}

export type PaginationProps = {
  /** Total number of pages. */
  count: number
  /** The current page, 1-based. */
  page?: number
  /** How many page numbers to show either side of the current one. */
  siblings?: number
  /** Accessible name for the landmark. */
  label?: string
  /** Builds the href for a page number. `$p` is replaced with the page. */
  href?: string
  className?: string
}

export const Pagination = forwardRef<SkPaginationElement, PaginationProps>(function Pagination(
  { count, page, siblings, label, href, className },
  ref,
): ReactElement {
  return (
    <sk-pagination
      ref={ref}
      class={cn(className)}
      count={count}
      page={page}
      siblings={siblings}
      label={label}
      href={href}
    />
  )
})
