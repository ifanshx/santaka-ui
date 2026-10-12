import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Link — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A link is an anchor. This component exists for two reasons, not for
 * decoration:
 *
 *  1. The underline and focus treatment are the part every design system gets
 *     subtly wrong, and they are stated once here.
 *  2. It documents the one rule a component cannot enforce: an action is a
 *     button, a navigation is a link. `sk-button` exists for the former.
 *
 * Because it is a real `<a>` under the hood, middle-click, "open in new tab",
 * and copying the URL all work — the things a `div` with a click handler breaks.
 */
@Component({
  tag: "sk-link",
  scoped: true,
  shadow: false,
})
export class SkLink {
  /** The destination. A link that navigates. */
  @Prop({ reflect: true }) href = ""

  /**
   * `external` marks a link that leaves the application: it adds the external
   * icon, sets `target="_blank"`, and adds `rel="noopener noreferrer"`. Left
   * off by default because most links do not leave.
   */
  @Prop({ reflect: true }) external = false

  /** Suppresses the underline until hover or focus. */
  @Prop({ reflect: true }) subtle = false

  /** Opens in a new tab without the external treatment. */
  @Prop({ reflect: true }) target?: string

  /** Forwarded to the underlying anchor. */
  @Prop({ reflect: true }) rel?: string

  @Prop({ reflect: true }) download?: string

  @Element() private host!: HTMLElement

  componentWillLoad() {
    if (this.external) {
      // `noopener` prevents the new page from reaching back through
      // `window.opener`; `noreferrer` also withholds the Referer. Both are set
      // together because a `target="_blank"` without them is a known leak.
      this.target = this.target ?? "_blank"
      this.rel = this.rel ?? "noopener noreferrer"
    }
  }

  render() {
    const isDisabled = this.href === "" && this.download === undefined

    return (
      <Host
        data-slot="link"
        data-external={this.external ? "" : undefined}
        data-subtle={this.subtle ? "" : undefined}
        data-disabled={isDisabled ? "" : undefined}
        aria-disabled={isDisabled ? "true" : undefined}
        tabindex={isDisabled ? "-1" : undefined}
      >
        <a
          class="sk-link__anchor"
          data-slot="anchor"
          href={isDisabled ? undefined : this.href}
          target={this.target}
          rel={this.rel}
          download={this.download}
        >
          <slot />
        </a>
        {this.external ? (
          <span class="sk-link__external" data-slot="external-icon" aria-hidden="true" />
        ) : null}
      </Host>
    )
  }
}
