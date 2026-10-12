import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Spinner — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The visual is lifted from Icon Button's loading state, deliberately: two
 * components drawing the same ring two different ways is how a design system
 * drifts. If the spinner's look changes, it changes in both places or the
 * difference is a bug.
 *
 * Accessibility is the part that is easy to get wrong, so it is decided here
 * rather than left to the consumer:
 *
 *  - The element carries `role="status"`, so a screen reader announces it as a
 *    live region rather than skipping it as decoration.
 *  - The visible ring gets `aria-hidden="true"` — it is a picture of waiting,
 *    and the words are what get announced.
 *  - `label` defaults to "Loading". A spinner with no text is a picture of
 *    nothing to a screen reader; the type system makes omitting the words a
 *    choice the consumer has to make, not an accident.
 */

@Component({
  tag: "sk-spinner",
  scoped: true,
  shadow: false,
})
export class SkSpinner {
  /**
   * Ring diameter, from the icon-size tokens so the spinner matches the icon
   * beside it. Not the `size` prop's height scale: a spinner is a circle, and a
   * circle's size is its diameter.
   */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /**
   * What the wait is, announced to screen readers in place of the silent ring.
   * "Loading" is the honest default; "Saving draft…" is the better one.
   */
  @Prop() label = "Loading"

  /** Announces progress when it is known, e.g. "Uploading 60%". */
  @Prop() status = ""

  render() {
    return (
      <Host data-slot="spinner" role="status">
        {/* The ring is a picture; the words are the announcement. */}
        <span class="sk-spinner__ring" data-slot="ring" aria-hidden="true" />
        <span class="sk-visually-hidden" data-slot="label">
          {this.status || this.label}
        </span>
      </Host>
    )
  }
}
