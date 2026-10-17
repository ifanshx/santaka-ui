import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Accordion - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Fully compositional: `Accordion` renders the group, `AccordionItem` its
 * items, and the element owns the exclusion policy itself — which is the whole
 * point of the native `<details>` base. The adapter adds no state and no
 * aria wiring, matching the component, which invents no roles.
 */
export type SkAccordionElement = HTMLElement & {
  multiple: boolean
  variant: "default" | "plain"
}

export type AccordionProps = {
  /** Whether several panels may be open at once. */
  multiple?: boolean
  /** Visual dressing. `plain` drops the container chrome. */
  variant?: "default" | "plain"
  className?: string
  /** The `sk-accordion-item` children. */
  children?: ReactNode
}

export const Accordion = forwardRef<SkAccordionElement, AccordionProps>(function Accordion(
  { multiple, variant, className, children },
  ref,
): ReactElement {
  return (
    <sk-accordion ref={ref} class={cn(className)} multiple={multiple} variant={variant}>
      {children}
    </sk-accordion>
  )
})

export type SkAccordionItemElement = HTMLElement & {
  heading: string
  open: boolean
}

export type AccordionItemProps = {
  /** The summary text. */
  heading?: string
  /** Whether the panel starts expanded. The browser owns the toggle. */
  open?: boolean
  className?: string
  /** Panel content. */
  children?: ReactNode
}

export const AccordionItem = forwardRef<SkAccordionItemElement, AccordionItemProps>(
  function AccordionItem({ heading, open, className, children }, ref): ReactElement {
    return (
      <sk-accordion-item ref={ref} class={cn(className)} heading={heading} open={open}>
        {children}
      </sk-accordion-item>
    )
  },
)
