import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Taka - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Decorative, so there is nothing to control: no children, no events, no state.
 * The adapter exists only so a React consumer can place the mascot with the same
 * props the element documents rather than reaching for raw markup.
 */
export type SkTakaElement = HTMLElement & {
  mood: "idle" | "wave" | "bounce"
  size: "sm" | "md" | "lg"
}

export type TakaProps = {
  /**
   * What Taka is doing. The animated moods are cancelled entirely under
   * `prefers-reduced-motion`.
   */
  mood?: "idle" | "wave" | "bounce"
  /** Rendered size, in the icon scale. */
  size?: "sm" | "md" | "lg"
  className?: string
}

export const Taka = forwardRef<SkTakaElement, TakaProps>(function Taka(
  { mood, size, className },
  ref,
): ReactElement {
  return <sk-taka ref={ref} class={cn(className)} mood={mood} size={size} />
})
