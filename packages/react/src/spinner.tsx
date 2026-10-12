import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Spinner - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * `label` is optional in the type and defaults to "Loading" in the component.
 * It stays optional here rather than being forced, because the honest default
 * is often the right answer — forcing every call site to write
 * `label="Loading"` teaches copy-paste, not intention.
 */
export type SkSpinnerElement = HTMLElement & {
  size: "sm" | "md" | "lg"
  label: string
  status: string
}

export type SpinnerProps = {
  /** Ring diameter, from the icon-size tokens so it matches the icon beside it. */
  size?: "sm" | "md" | "lg"
  /** What the wait is, announced to screen readers. Defaults to "Loading". */
  label?: string
  /** Replaces the label when progress is known, e.g. "Uploading 60%". */
  status?: string
  className?: string
}

export const Spinner = forwardRef<SkSpinnerElement, SpinnerProps>(function Spinner(
  { size, label, status, className },
  ref,
): ReactElement {
  return <sk-spinner ref={ref} class={cn(className)} size={size} label={label} status={status} />
})
