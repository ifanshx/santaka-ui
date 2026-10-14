import { Component, Element, h, Host, Prop, Watch } from "@stencil/core"

/**
 * Tab — one selectable header inside an `sk-tabs` widget.
 *
 * The host element IS the tab: `sk-tabs`' sync pass writes `role="tab"`,
 * `aria-selected`, `tabindex`, and `data-state` onto it. No inner `<button>`:
 * a `role="tab"` containing a real button is a nested-interactive violation
 * (axe), and the APG pattern makes the tab itself the focusable element —
 * it is activated, not navigated to, and the widget owns Enter/Space and
 * the arrow keys. The platform-button benefit that motivated the earlier
 * button shape (free activation) came bundled with a violation that is not
 * negotiable, so activation is the widget's two extra key handlers.
 *
 * The tab does not own its active state — `sk-tabs` writes everything during
 * its sync pass. This component is the authored shape; the widget is the
 * behavior.
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
      <Host data-slot="tab" class="sk-tab__button">
        {this.label ? <span>{this.label}</span> : <slot />}
      </Host>
    )
  }
}
