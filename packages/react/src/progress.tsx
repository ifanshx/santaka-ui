import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Progress - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This adapter renders the same custom element and forwards the same props.
 *
 * `value` stays a number all the way through: number-to-string coercion at the
 * adapter would be invisible to type checking and wrong for a `max` of 1000
 * rendered as "1e+3" by some paths. Omitting `value` is the indeterminate
 * signal, the same as in the custom element.
 */
export type SkProgressElement = HTMLElement & {
  value?: number
  max: number
  label: string
  size: ProgressSize
}

export type ProgressSize = "sm" | "md" | "lg"

export type ProgressProps = {
  /** Current value. Omit (or pass non-finite) for the indeterminate sweep. */
  value?: number
  /** The scale the value is measured against. */
  max?: number
  /**
   * The accessible name. Passes through unmodified; the custom element only
   * applies it as `aria-label` when the consumer has set no labelling of
   * their own.
   */
  label?: string
  /** Track height scale. */
  size?: ProgressSize
  className?: string
  children?: ReactNode
}

export const Progress = forwardRef<SkProgressElement, ProgressProps>(function Progress(
  { value, max, label, size, className, children },
  ref,
): ReactElement {
  return (
    <sk-progress ref={ref} class={cn(className)} value={value} max={max} label={label} size={size}>
      {children}
    </sk-progress>
  )
})
