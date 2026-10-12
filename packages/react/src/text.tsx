import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Text - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The adapter renders children verbatim into the light DOM: the element the
 * consumer chose keeps its semantics, and the custom element only sets
 * typography on it. There is no `as` prop and deliberately cannot be one —
 * choosing the element is the consumer's document structure, and a prop that
 * does it for them is how `<h3>`s end up wearing `<h2>`'s look while the outline
 * says otherwise.
 */
export type SkTextElement = HTMLElement & {
  variant: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
  family: "inherit" | "sans" | "display" | "mono"
  muted: boolean
}

export type TextProps = {
  /**
   * The type step, named exactly as the token is. Applies size, line-height,
   * weight, and tracking as one record.
   */
  variant?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
  /** Which family to set. `inherit` (the default) leaves `font-family` alone. */
  family?: "inherit" | "sans" | "display" | "mono"
  /** Secondary text color. The one color decision a text component owns. */
  muted?: boolean
  className?: string
  /**
   * The element carrying the text — a `<h1>`, `<p>`, `<span>`, anything. It is
   * rendered as a direct child, which is what keeps its semantics intact.
   */
  children?: ReactNode
}

export const Text = forwardRef<SkTextElement, TextProps>(function Text(
  { variant, family, muted, className, children },
  ref,
): ReactElement {
  return (
    <sk-text ref={ref} class={cn(className)} variant={variant} family={family} muted={muted}>
      {children}
    </sk-text>
  )
})
