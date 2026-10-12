import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Button — React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This is an adapter, not a reimplementation: it renders the same custom
 * element and forwards the same props, so the variant enum, the `data-*` state
 * attributes, the ARIA wiring, and the form semantics are all owned by
 * `@santaka-ui/web-components`.
 *
 * Every convention from section 4 holds here:
 *   - `variant` and `size` are the only visual props.
 *   - `disabled` and `loading` are ARIA names, not `isDisabled`.
 *   - `className` merges last so consumer styles win.
 *   - The ref points at the custom element itself.
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"
export type ButtonType = "button" | "submit" | "reset"

/** The element Stencil generates for `<sk-button>`. */
export type SkButtonElement = HTMLElement & {
  variant: ButtonVariant
  size: ButtonSize
  disabled: boolean
  loading: boolean
  type: ButtonType
}

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: ButtonType
  className?: string
  children?: ReactNode
}

export const Button = forwardRef<SkButtonElement, ButtonProps>(function Button(
  { variant, size, disabled, loading, type, className, children },
  ref,
): ReactElement {
  return (
    <sk-button
      ref={ref}
      class={cn(className)}
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      type={type}
    >
      {children}
    </sk-button>
  )
})
