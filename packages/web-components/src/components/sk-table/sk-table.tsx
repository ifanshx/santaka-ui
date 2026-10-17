import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Table — a skin over a table the consumer authors, not a table builder.
 *
 * The consumer writes a real `<table>` with its own `<caption>`, `<thead>`,
 * `<th scope="col">` and `<tbody>`; this component contributes the container,
 * the horizontal overflow handling, and the brutalist style. It takes the same
 * position `sk-card` takes toward its content: it styles a surface, it does not
 * invent the markup inside it. There is no column config, no data prop, and no
 * cell rendering — the consumer's real table semantics are the component's
 * accessibility story, not something to reimplement.
 *
 * KNOWN LIMITATION: sticky headers are not implemented. The scroll container's
 * height belongs to the consumer (set `block-size` on it yourself); a
 * `position: sticky` header only works once that height is constrained, and the
 * component cannot assume one. A consumer who constrains the height may add
 * `sk-table thead th { position: sticky }` from their own CSS.
 */

@Component({
  tag: "sk-table",
  // ADR-011: scoped styles, not Shadow DOM. The consumer's table lives in the
  // host's own subtree, which is what makes `sk-table thead th` descendant
  // selectors possible in the first place.
  scoped: true,
  shadow: false,
})
export class SkTable {
  /**
   * `default` is the stroked, shadowed container; `plain` drops the container
   * chrome for a table sitting inside a `sk-card`.
   */
  @Prop({ reflect: true }) variant: "default" | "plain" = "default"

  /** Zebra rows: even body rows take the sunken surface. */
  @Prop({ reflect: true }) striped = false

  /**
   * Cell padding, not a height scale. `size` is the height scale every other
   * component uses and a table has no intrinsic height — it is whatever its
   * rows make it. Density is the axis a table actually varies on, and its
   * default value is named for what it is rather than for a comfort level:
   * `default` matches `variant`, and a table that wants tighter rows opts in.
   */
  @Prop({ reflect: true }) density: "default" | "compact" = "default"

  /**
   * The name of the scroll region.
   *
   * The viewport is focusable (`tabindex="0"`) because a scrollable region
   * that cannot be reached from the keyboard is unreachable content (WCAG
   * 2.1.1). With a label it also carries `role="group"` and an accessible
   * name; with none it carries no role at all — an unnamed group is noise in
   * the accessibility tree, not structure.
   */
  @Prop() label = ""

  render() {
    return (
      <Host data-slot="table">
        <div
          class="sk-table__viewport"
          data-slot="viewport"
          tabindex={0}
          {...(this.label !== "" ? { role: "group", "aria-label": this.label } : {})}
        >
          <slot />
        </div>
      </Host>
    )
  }
}
