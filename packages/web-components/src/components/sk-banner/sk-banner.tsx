import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Banner — a page-level message that sits above the content it is about.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A banner and an alert look alike and are not the same thing, so the
 * difference is the first thing recorded here:
 *
 * - **`sk-alert` is inline.** It renders in the document flow, pushes content
 *   down, and belongs to the section it describes.
 * - **`sk-banner` is regional.** It spans the width of its container and sits
 *   *above* the content, which is why it is the component for site-wide
 *   notices — maintenance windows, a degraded service, an expired trial.
 *
 * That difference decides the ARIA. A banner that spans the page is a landmark,
 * so the role is `region` rather than a live region: **`role="banner"` is not
 * used**, because in ARIA that name means the site header and is reserved for
 * one element per page — putting it here would collide with the consumer's real
 * `<header>` and leave two "banner" landmarks. `region` with an accessible name
 * is the correct shape, and it is only a landmark once it is named, which is
 * why `aria-label` or `aria-labelledby` is required for the landmark role to
 * apply at all.
 *
 * It is **not** announced as an interruption. An alert interrupts because it
 * appeared in reaction to something the user just did; a banner was already
 * there when the page loaded, and announcing it as an interruption would talk
 * over the content the user came for. Consumers who need an interruption should
 * use `sk-alert` or `sk-toast`, which own those contracts.
 *
 * Like `sk-alert`, it has no dismiss button. Dismissing is a different
 * component: it needs a close affordance, focus into it, and a focus return
 * when the banner goes away.
 */
@Component({
  tag: "sk-banner",
  scoped: true,
  shadow: false,
})
export class SkBanner {
  @Element() host!: HTMLElement

  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "neutral" | "primary" | "success" | "warning" | "danger" =
    "neutral"

  /**
   * Heading text. Named `heading`, not `title`, for the reason `sk-alert`
   * records: `title` is a standardized `HTMLElement` member, so a prop by that
   * name is shadowed by the prototype and the browser would surface it as a
   * hover tooltip over the whole banner.
   */
  @Prop() heading = ""

  /**
   * Whether the banner spans its container as a full-width strip.
   *
   * `false` keeps it in the flow as a block with the standard chrome, for a
   * message about one section rather than the whole page.
   */
  @Prop({ reflect: true }) fullWidth = true

  componentWillRender() {
    if (!this.host.hasAttribute("role")) {
      // Not `role="banner"`: in ARIA that is the site header, and there may be
      // only one per page. This is a named region instead — and a `region` is
      // only exposed as a landmark when it has an accessible name, which is why
      // the documentation requires `aria-label` or `aria-labelledby`.
      this.host.setAttribute("role", "region")
    }
  }

  render() {
    return (
      // `data-full-width` is written explicitly rather than left to `reflect`,
      // because reflect omits the attribute when the value is `false` and a
      // stylesheet cannot target an attribute that is not there. "false" is the
      // case that needs styling, not the case that can be omitted.
      <Host
        data-slot="banner"
        data-variant={this.variant}
        data-full-width={this.fullWidth ? "true" : "false"}
      >
        <span class="sk-banner__icon" data-slot="icon" aria-hidden="true" />
        <span class="sk-banner__content" data-slot="content">
          {this.heading ? (
            <span class="sk-banner__heading" data-slot="heading">
              {this.heading}
            </span>
          ) : null}
          <span class="sk-banner__body" data-slot="body">
            <slot />
          </span>
        </span>
        <span class="sk-banner__actions" data-slot="actions">
          <slot name="actions" />
        </span>
      </Host>
    )
  }
}
