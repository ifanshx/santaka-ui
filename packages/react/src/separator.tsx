import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Separator - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * No children, matching the component: a separator has no content. The `<hr>`
 * is the element.
 */
export type SkSeparatorElement = HTMLElement & {
  orientation: "horizontal" | "vertical"
  decorative: boolean
}

export type SeparatorProps = {
  /** Axis of the line. Vertical separators need a sized parent. */
  orientation?: "horizontal" | "vertical"
  /** Purely visual: removes the element from the accessibility tree. */
  decorative?: boolean
  /** Label for a meaningful separator, e.g. "or" between two actions. */
  label?: string
  className?: string
}

export const Separator = forwardRef<SkSeparatorElement, SeparatorProps>(function Separator(
  { orientation, decorative, label, className },
  ref,
): ReactElement {
  return (
    <sk-separator
      ref={ref}
      class={cn(className)}
      orientation={orientation}
      decorative={decorative}
      label={label}
    />
  )
})
