import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Badge — Tier 1 display component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A badge is a static label, not an interactive element. That is stated here
 * because "badge" invites the wrong implementation: a clickable badge is a
 * button with extra steps, and a badge inside a link is the link's job.
 *
 * The one behavior worth encoding is the dot. A status dot conveys meaning by
 * color alone, which WCAG 1.4.1 forbids, so `variant="dot"` renders a shape that
 * also carries a text label the consumer supplies. `statusLabel` is required
 * for that variant in the React types.
 */
@Component({
  tag: "sk-badge",
  scoped: true,
  shadow: false,
})
export class SkBadge {
  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "neutral" | "primary" | "success" | "warning" | "danger" =
    "neutral"

  /** Control height. */
  @Prop({ reflect: true }) size: "sm" | "md" = "md"

  /**
   * Renders the badge as a dot instead of a pill. Requires a text label for
   * screen readers, because the dot itself conveys nothing but color.
   */
  @Prop({ reflect: true }) dot = false

  /** Screen-reader text for the dot variant. Required when `dot` is set. */
  @Prop() statusLabel = ""

  render() {
    if (this.dot) {
      return (
        <Host data-slot="badge" data-variant={this.variant} data-size={this.size} data-dot="">
          <span class="sk-visually-hidden" data-slot="status-label">
            {this.statusLabel}
          </span>
        </Host>
      )
    }

    return (
      <Host data-slot="badge" data-variant={this.variant} data-size={this.size}>
        <slot />
      </Host>
    )
  }
}
