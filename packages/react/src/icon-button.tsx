import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"
import type { ButtonSize, ButtonType, ButtonVariant } from "./button.js"

/**
 * Icon Button — React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * An adapter, not a reimplementation: it renders the same custom element and
 * forwards the same props, so the accessible-name handling, the 44px target,
 * the ARIA wiring, and the form semantics are owned upstream.
 *
 * `label` is required, not optional. In TypeScript that is the whole point of
 * shipping types: an icon-only control with no name is the single most common
 * accessibility mistake in a component library, and making it a required prop
 * turns it into a compile error instead of a bug report.
 */
export type SkIconButtonElement = HTMLElement & {
  label: string
  variant: ButtonVariant
  size: ButtonSize
  disabled: boolean
  loading: boolean
  type: ButtonType
}

export type IconButtonProps = {
  /** The accessible name. Required: there is no visible text to fall back on. */
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: ButtonType
  className?: string
  children?: ReactNode
}

export const IconButton = forwardRef<SkIconButtonElement, IconButtonProps>(function IconButton(
  { label, variant, size, disabled, loading, type, className, children },
  ref,
): ReactElement {
  return (
    <sk-icon-button
      ref={ref}
      class={cn(className)}
      label={label}
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      type={type}
    >
      {children}
    </sk-icon-button>
  )
})
