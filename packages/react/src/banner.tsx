import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Banner - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * One thing here is a requirement rather than a convenience: `ariaLabel` or
 * `ariaLabelledby`. The element sets `role="region"`, and ARIA only exposes a
 * `region` as a landmark when it has an accessible name — so an unnamed banner
 * is not a landmark at all and a screen-reader user has no way to jump to it.
 * The type enforces it instead of leaving it to review.
 */
export type SkBannerElement = HTMLElement & {
  variant: BannerVariant
  heading: string
  fullWidth: boolean
}

/** Visual emphasis. */
export type BannerVariant = "neutral" | "primary" | "success" | "warning" | "danger"

export type BannerProps = {
  /** Visual emphasis. */
  variant?: BannerVariant
  /**
   * Heading text. Named `heading`, not `title`: `title` is a standardized
   * `HTMLElement` member, so the browser would surface it as a hover tooltip.
   */
  heading?: string
  /**
   * Whether the banner spans its container as a full-width strip. `false` keeps
   * it in the flow, for a message about one section.
   */
  fullWidth?: boolean
  className?: string
  children?: ReactNode
} & (
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-labelledby": string; "aria-label"?: never }
)

export const Banner = forwardRef<SkBannerElement, BannerProps>(function Banner(
  { variant, heading, fullWidth, className, children, ...aria },
  ref,
): ReactElement {
  return (
    <sk-banner
      ref={ref}
      class={cn(className)}
      variant={variant}
      heading={heading}
      full-width={fullWidth === false ? "false" : undefined}
      {...aria}
    >
      {children}
    </sk-banner>
  )
})
