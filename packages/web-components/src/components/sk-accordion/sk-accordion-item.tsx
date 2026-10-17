import { Component, Element, Host, Prop, Watch, h } from "@stencil/core"

/**
 * Accordion item — one disclosure panel inside an `sk-accordion`.
 *
 * A real native `<details>`/`<summary>` pair, for the reason sk-dialog uses the
 * native `<dialog>`: the browser already owns the semantics, the focus
 * behaviour and Enter/Space activation, and a JavaScript reimplementation of
 * that is a second, worse one.
 *
 * Known limitation, recorded rather than half-implemented: the ARIA APG
 * accordion pattern adds roving arrow-key movement between summaries, and
 * native `<details>` has never had it. Enter and Space are the platform's, the
 * focus stop is the platform's, and arrow-key navigation is not built here.
 */
@Component({
  tag: "sk-accordion-item",
  // ADR-011: scoped styles, not Shadow DOM.
  scoped: true,
  shadow: false,
})
export class SkAccordionItem {
  @Element() host!: HTMLElement

  /**
   * The summary text.
   *
   * A `<span>` inside the `<summary>`, not a heading element: the item does not
   * know what level it sits at in the document outline, and a hard-coded
   * heading inside it contradicts the surrounding structure (sk-card's stated
   * reason for the same shape).
   */
  @Prop() heading = ""

  /**
   * Whether the panel is expanded. Mirrors `<details open>` and is reflected: a
   * consumer can author `<sk-accordion-item open>` in HTML — including
   * server-rendered markup for an already-expanded item — and the attribute
   * tracks what the browser did on a user toggle, so the parent can close
   * siblings and the consumer can read the real state.
   */
  @Prop({ reflect: true, mutable: true }) open = false

  private detailsEl?: HTMLDetailsElement

  componentWillLoad() {
    // A consumer's static `open` attribute is the parsed property already; this
    // only closes the gap when a renderer left the attribute without the value.
    if (this.host.hasAttribute("open") && !this.open) this.open = true
  }

  disconnectedCallback() {
    this.detailsEl?.removeEventListener("toggle", this.onToggle)
  }

  /**
   * The listener goes on the `<details>` element, not on the host.
   *
   * `toggle` does not bubble — a host-level listener never fires, and the
   * reflected `open` silently stops matching what the browser did. That was this
   * component's first bug: the markup-driven state worked and every interaction
   * was invisible. The ref callback re-runs on each render, and
   * `addEventListener` with the same function reference is a no-op the second
   * time, so no listener accumulates.
   */
  private bindDetails = (el?: HTMLElement) => {
    // Stencil's ref signature is `(elm?: HTMLElement) => void`, while the node
    // this component renders is always a `<details>`; narrowing here keeps one
    // field typed as what it holds.
    const details = el instanceof HTMLDetailsElement ? el : undefined
    // A ref called with nothing is a teardown of the previous vnode, not the
    // element leaving the DOM — the node is still rendered. Detaching there was
    // this fix's own first bug: the listener was gone by the time the page had
    // settled, and every click still toggled the native node while the reflected
    // property stopped following it.
    if (!details || this.detailsEl === details) return
    this.detailsEl?.removeEventListener("toggle", this.onToggle)
    this.detailsEl = details
    details.addEventListener("toggle", this.onToggle)
    // The first render has to sync the node before the listener can matter.
    this.openChanged()
  }

  /**
   * The one writer of the native node, for both paths. The `toggle` listener
   * writes the state back to this property; this watcher makes a property write
   * from the parent (closing siblings) reach the node, which a bare attribute
   * set never would.
   */
  @Watch("open")
  openChanged() {
    if (this.detailsEl && this.detailsEl.open !== this.open) {
      this.detailsEl.open = this.open
    }
  }

  /**
   * A toggle of the native `<details>` — by the user, or asynchronously after a
   * programmatic write, because the platform queues a `toggle` for both. The
   * state is written back to the reflected property and the item reports once.
   * A programmatic write therefore also re-reports, with the value it was just
   * given: the write is idempotent, and the group ignores the close it caused.
   */
  private onToggle = () => {
    const next = this.detailsEl?.open ?? false
    this.open = next
    // Bubbling and composed, the shape of `sk-value-change` on the form
    // controls — a consumer listens on an ancestor, not the item.
    this.host.dispatchEvent(
      new CustomEvent("sk-open-change", { detail: { open: next }, bubbles: true, composed: true }),
    )
  }

  render() {
    return (
      <Host data-slot="accordion-item" data-open={this.open ? "true" : "false"}>
        {/*
          The native marker is hidden and a CSS-drawn one is rendered at
          data-slot="marker"; the plus/minus swap is drawn by pseudo-elements
          on that element, not by an SVG or a font glyph.
        */}
        <details class="sk-accordion__details" ref={this.bindDetails} open={this.open}>
          <summary class="sk-accordion__summary" data-slot="summary">
            <span class="sk-accordion__heading" data-slot="heading">
              {this.heading}
            </span>
            <span class="sk-accordion__marker" data-slot="marker" aria-hidden="true" />
          </summary>
          {/*
            The wrapper is styled, never the slot: scoped mode removes the
            `<slot>` element, so a slot selector matches nothing.
          */}
          <div class="sk-accordion__content" data-slot="content">
            <slot />
          </div>
        </details>
      </Host>
    )
  }
}
