import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Kbd - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The adapter renders children into the light DOM `<kbd>` the element owns.
 * There is no `as` prop and no way to swap that element: the reason this
 * component exists is that `<kbd>` *is* the semantics, and a prop that let the
 * consumer replace it with a `<span>` would quietly remove the only thing the
 * component contributes.
 */
export type SkKbdElement = HTMLElement & {
  size: KbdSize
}

/** The type step the shortcut is set in. */
export type KbdSize = "sm" | "md"

export type KbdProps = {
  /** The type step the shortcut is set in. */
  size?: KbdSize
  className?: string
  /** The key or key combination, as text: `Ctrl`, `Shift + K`. */
  children?: ReactNode
}

export const Kbd = forwardRef<SkKbdElement, KbdProps>(function Kbd(
  { size, className, children },
  ref,
): ReactElement {
  return (
    <sk-kbd ref={ref} class={cn(className)} size={size}>
      {children}
    </sk-kbd>
  )
})
