import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Table - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A skin over a table the consumer authors: the children are the consumer's
 * real `<table>` with its own `<caption>`, `<th scope>`, and `<tbody>`, and
 * the adapter forwards them into the default slot untouched. There is no
 * column config and no data prop — that is the component's contract, not a
 * missing feature.
 */
export type SkTableElement = HTMLElement & {
  variant: "default" | "plain"
  density: "default" | "compact"
  striped: boolean
  label: string
}

export type TableProps = {
  /** Visual treatment. `plain` drops the container chrome. */
  variant?: "default" | "plain"
  /** Cell padding, not a height scale. */
  density?: "default" | "compact"
  /** Zebra rows: even body rows take the sunken surface. */
  striped?: boolean
  /**
   * The name of the scroll region. With a label the (focusable) viewport
   * carries `role="group"` and an accessible name; with none it carries no
   * role at all.
   */
  label?: string
  className?: string
  /** The consumer-authored `<table>`. */
  children?: ReactNode
}

export const Table = forwardRef<SkTableElement, TableProps>(function Table(
  { variant, density, striped, label, className, children },
  ref,
): ReactElement {
  return (
    <sk-table
      ref={ref}
      class={cn(className)}
      variant={variant}
      density={density}
      striped={striped}
      label={label}
    >
      {children}
    </sk-table>
  )
})
