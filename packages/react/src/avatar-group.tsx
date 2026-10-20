import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * AvatarGroup - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * `label` is required by the type. A `role="group"` with no accessible name is
 * skipped by most screen readers, so an unnamed group is not a group from a
 * reader's point of view — and the element renders no role at all in that case
 * rather than announcing something empty.
 *
 * The avatars are children, not a data array: `sk-avatar` already owns the
 * initials and the accessible name, and a parallel prop would duplicate it.
 */
export type SkAvatarGroupElement = HTMLElement & {
  max: number
  label: string
  size: "sm" | "md" | "lg"
}

export type AvatarGroupProps = {
  /** How many avatars to show before collapsing the rest into a count. `0` shows all. */
  max?: number
  /** The accessible name for the group — "Assigned to", "Contributors". */
  label: string
  /** Diameter applied to every avatar in the group. */
  size?: "sm" | "md" | "lg"
  className?: string
  /** `sk-avatar` elements, rendered by the `Avatar` adapter. */
  children?: ReactNode
}

export const AvatarGroup = forwardRef<SkAvatarGroupElement, AvatarGroupProps>(function AvatarGroup(
  { max, label, size, className, children },
  ref,
): ReactElement {
  return (
    <sk-avatar-group ref={ref} class={cn(className)} max={max} label={label} size={size}>
      {children}
    </sk-avatar-group>
  )
})
