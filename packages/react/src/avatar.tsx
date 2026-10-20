import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Avatar - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The adapter is thin, and one thing in it is worth naming: there is no
 * `initials` prop. Initials are derived from `name` inside the element, because
 * two fields that can disagree are how an avatar ends up showing "JD" while
 * announcing "Jane Doe".
 *
 * `name` is required by the type. Without it the element has nothing to
 * announce and nothing to render — it hides itself from assistive technology
 * rather than inventing a label — so a nameless avatar is a compile error here
 * instead of a silent gap.
 */
export type SkAvatarElement = HTMLElement & {
  name: string
  src: string
  size: AvatarSize
}

/** Diameter. An avatar is square by ratio, so `size` is one axis. */
export type AvatarSize = "sm" | "md" | "lg"

export type AvatarProps = {
  /**
   * The person's name — the accessible name of the image and the source of the
   * initials. Required: an avatar with no name carries no information.
   */
  name: string
  /** Image source. Without it, the initials render. */
  src?: string
  /** Diameter. */
  size?: AvatarSize
  className?: string
}

export const Avatar = forwardRef<SkAvatarElement, AvatarProps>(function Avatar(
  { name, src, size, className },
  ref,
): ReactElement {
  return <sk-avatar ref={ref} class={cn(className)} name={name} src={src} size={size} />
})
