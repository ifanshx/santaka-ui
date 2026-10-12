import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Separator — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * It renders a real `<hr>` because that is the semantic: a thematic break
 * between content, announced by screen readers unless the consumer says it is
 * purely visual. `decorative` flips it to `role="none"` — the same ruling
 * ARIA APG makes for separators that exist only for the eye.
 *
 * The line is the hairline token (`border.width`), not the 3px chrome stroke:
 * a separator divides content, and a 3px stroke between paragraphs would read
 * as a wall. Its geometry is the one place this system uses the hairline
 * deliberately.
 */

@Component({
  tag: "sk-separator",
  scoped: true,
  shadow: false,
})
export class SkSeparator {
  /** Axis of the line. Vertical separators need a sized parent. */
  @Prop({ reflect: true }) orientation: "horizontal" | "vertical" = "horizontal"

  /**
   * Purely visual: removes the element from the accessibility tree. Set it
   * whenever the surrounding structure — a heading, whitespace, a card boundary
   * — already communicates the break.
   */
  @Prop({ reflect: true }) decorative = false

  /**
   * Label for a meaningful separator, e.g. "or" between two actions. Announced
   * only when the separator is not decorative, because a name on a
   * `role="none"` element is a contradiction.
   */
  @Prop() label = ""

  render() {
    return (
      <Host
        data-slot="separator"
        role={this.decorative ? "none" : "separator"}
        aria-orientation={this.orientation}
        aria-label={this.decorative || !this.label ? undefined : this.label}
      >
        {/* No slot: a separator has no content. The <hr> is the element. */}
      </Host>
    )
  }
}
