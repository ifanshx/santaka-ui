import { Component, Element, h, Host, Prop, Watch } from "@stencil/core"

/**
 * Tab — one selectable header inside an `sk-tabs` widget.
 *
 * Renders a real `<button>`: tabs are buttons in the ARIA pattern (they are
 * activated, not navigated to), and a real button brings the platform's
 * keyboard and activation behavior for free.
 *
 * The tab does not own its active state — `sk-tabs` writes `aria-selected`,
 * `tabindex`, and `data-state` during its sync pass. This component is the
 * authored shape; the widget is the behavior.
 */
@Component({
  tag: "sk-tab",
  scoped: true,
  shadow: false,
})
export class SkTab {
  @Element() host!: HTMLElement

  /** The tab's label. A consumer may instead slot rich content. */
  @Prop() label = ""

  @Watch("label")
  labelChanged() {
    // Slotted content changes when the label changes; the widget's sync pass
    // reads the DOM, so there is nothing to recompute here beyond forcing a
    // re-render with the new text.
  }

  render() {
    return (
      <Host data-slot="tab">
        <button type="button" class="sk-tab__button" data-slot="tab-button" tabindex={-1}>
          {this.label ? <span>{this.label}</span> : <slot />}
        </button>
      </Host>
    )
  }
}
