import { Component, Element, h, Host, Prop, Watch } from "@stencil/core"

/**
 * TabPanel — the content one tab reveals.
 *
 * `hidden` is written by `sk-tabs` during its sync pass; the panel owns no
 * state. It renders a real `<div>` with `role="tabpanel"`, labelled by its
 * tab through the widget's `aria-labelledby` wiring.
 */
@Component({
  tag: "sk-tab-panel",
  scoped: true,
  shadow: false,
})
export class SkTabPanel {
  @Element() host!: HTMLElement

  /** Panels start hidden; the widget reveals the active one. */
  @Prop({ mutable: true, reflect: true }) hidden = true

  @Watch("hidden")
  hiddenChanged() {
    /* Reflected by the prop; the widget drives it. */
  }

  render() {
    return (
      <Host data-slot="panel" role="tabpanel" tabindex={0}>
        <slot />
      </Host>
    )
  }
}
