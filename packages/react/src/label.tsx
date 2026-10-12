import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Label - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The prop is `htmlFor`, which is the React idiom for the native `for`
 * attribute — and the adapter maps it onto the element's `for` attribute, so
 * both spellings a consumer might reach for arrive at the same place.
 */
export type SkLabelElement = HTMLElement & {
  forId: string
  required: boolean
  marker: "after" | "before"
}

export type LabelProps = {
  /**
   * The id of the control this label names. Note that field components render
   * their control with the id `${hostId}-control`, so `for` must carry that
   * suffix.
   */
  htmlFor: string
  /** Renders the required marker. The control's own `required` carries the semantics. */
  required?: boolean
  /** Where the marker sits. `before` when the control leads the sentence. */
  marker?: "after" | "before"
  className?: string
  children?: ReactNode
}

export const Label = forwardRef<SkLabelElement, LabelProps>(function Label(
  { htmlFor, required, marker, className, children },
  ref,
): ReactElement {
  return (
    <sk-label
      ref={ref}
      class={cn(className)}
      // The element's attribute is `for`; the adapter's prop is the React idiom.
      for={htmlFor}
      required={required}
      marker={marker}
    >
      {children}
    </sk-label>
  )
})
