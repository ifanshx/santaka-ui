import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Text — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * This component exists because of how the example page styled its headings
 * before it: every `<h2>` carried an inline `style="font-size:
 * var(--sk-text-lg-size)"`, which is the type step applied as a fragment — the
 * size without the weight and tracking that the step prescribes. A type scale
 * where the consumer must assemble size, weight, and tracking by hand is not a
 * type scale; it is three tokens and a hope they stay in sync.
 *
 * `sk-text` applies **one whole step** — size, line-height, weight, and
 * tracking together, from the same token that defines them. It renders no
 * wrapper box: it is display-by-attribute styling on whatever element the
 * consumer chose, because the element choice (heading, paragraph, span) is the
 * consumer's document structure, not this component's business.
 *
 * Two things this deliberately does not do:
 *
 * 1. **No `as`/`tag` prop.** An element-choosing prop invites rendering an
 *    `<h3>` because it looks right, which is exactly how heading levels end up
 *    contradicting the document outline. Pick the element in markup; pick the
 *    look here.
 * 2. **No glass, no brutalist chrome.** Text is not a surface. It takes no
 *    stroke, no shadow, and no press.
 */

@Component({
  tag: "sk-text",
  scoped: true,
  shadow: false,
})
export class SkText {
  /**
   * The type step to apply, named exactly as the token is.
   *
   * This is the `variant` slot of the §4 two-prop rule — the axis a text
   * component varies on. `size` is not used for it, because `size` is the
   * height scale every other component uses and a text element has no height of
   * its own to scale.
   */
  @Prop({ reflect: true }) variant:
    "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display" = "base"

  /**
   * Which family to set. The default leaves `font-family` untouched, because
   * body copy inherits the platform stack and re-declaring it per-element would
   * fight any consumer who changes `--sk-font-body`.
   */
  @Prop({ reflect: true }) family: "inherit" | "sans" | "display" | "mono" = "inherit"

  /**
   * Muted text. The one color decision a text component owns, because
   * secondary text is a *typographic* role in this system — it exists as
   * `.sk-text-muted` today, and this is where that class retires to.
   */
  @Prop({ reflect: true }) muted = false

  render() {
    return (
      <Host data-slot="text">
        <slot />
      </Host>
    )
  }
}
