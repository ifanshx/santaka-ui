import { Component, Element, Host, Listen, Prop, h } from "@stencil/core"

/**
 * Accordion — a compound disclosure group over native `<details>`.
 *
 * The base is the NATIVE `<details>`/`<summary>` pair, for the reason sk-dialog
 * uses the native `<dialog>`: the browser already owns the disclosure
 * semantics, the focus behaviour and Enter/Space activation. A JavaScript
 * reimplementation of that would be a second, worse one.
 *
 * This element holds items and owns the exclusion policy. It invents no ARIA
 * roles: `<details>` and `<summary>` describe themselves, and adding
 * `role="list"`/`role="listitem"` on top would invent structure the DOM does
 * not have.
 */
@Component({
  tag: "sk-accordion",
  // ADR-011: scoped styles, not Shadow DOM.
  scoped: true,
  shadow: false,
})
export class SkAccordion {
  @Element() host!: HTMLElement

  /**
   * Whether several panels may be open at once. When false, opening one item
   * closes the others.
   */
  @Prop({ reflect: true }) multiple = false

  /**
   * Visual dressing. `default` is the stroked container with a hard shadow;
   * `plain` drops the container chrome for an accordion that sits inside a
   * card — mirror of sk-card's `bare` reasoning.
   */
  @Prop({ reflect: true }) variant: "default" | "plain" = "default"

  /**
   * One bubbling `sk-open-change` listener on the host is enough, and it
   * survives items added after first render — wiring every item would need a
   * MutationObserver to keep up with new children.
   */
  @Listen("sk-open-change")
  handleOpenChange(event: CustomEvent<{ open: boolean }>) {
    if (this.multiple) return
    const item = event.target as HTMLElement | null
    if (!item || !event.detail?.open) return
    // Native closure, not a class toggle: `open` is the `<details>` state the
    // browser itself animates and removes, so writing the reflected property
    // is exactly what closing by user interaction does.
    for (const other of this.host.querySelectorAll("sk-accordion-item")) {
      if (other !== item && other.open) {
        other.open = false
      }
    }
  }

  render() {
    return <Host data-slot="accordion" data-variant={this.variant} />
  }
}
