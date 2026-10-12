import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Card - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props.
 *
 * Slotting needs no special handling here, and that is worth stating because it
 * is the usual place a React adapter for a slotted component goes wrong. React
 * renders children into the custom element's light DOM and the browser performs
 * slot assignment, so `<div slot="header">` slots exactly as it does in plain
 * HTML. Wrapping children in a `Slot` component would re-implement the browser's
 * own algorithm and is deliberately absent.
 */
export type SkCardElement = HTMLElement & {
  variant: "default" | "outlined" | "bare"
  padding: "none" | "sm" | "md" | "lg"
  heading: string
  subtitle: string
}

export type CardProps = {
  /** Visual emphasis. `outlined` drops the fill; `bare` drops fill and shadow. */
  variant?: "default" | "outlined" | "bare"
  /** Inner padding. Not `size`: a card has no intrinsic height to scale. */
  padding?: "none" | "sm" | "md" | "lg"
  /**
   * Heading text, rendered in the header slot's fallback.
   *
   * Pass `heading` only when the card's heading is plain text. If it needs to be a
   * real heading, put one in the header slot instead — `<h2 slot="header">` —
   * because the card does not know its level in your document outline.
   */
  heading?: string
  /** Supporting text under the heading. */
  subtitle?: string
  className?: string
  /**
   * Body content, plus any `slot="header"` and `slot="footer"` children. Each
   * slot is optional and renders nothing when empty.
   */
  children?: ReactNode
}

export const Card = forwardRef<SkCardElement, CardProps>(function Card(
  { variant, padding, heading, subtitle, className, children },
  ref,
): ReactElement {
  return (
    <sk-card
      ref={ref}
      class={cn(className)}
      variant={variant}
      padding={padding}
      heading={heading}
      subtitle={subtitle}
    >
      {children}
    </sk-card>
  )
})
