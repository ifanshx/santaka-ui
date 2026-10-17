import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Alert — an inline, static status message.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * An alert is chrome, not a floating layer: it renders in the document flow,
 * pushes content down when it appears, and never overlays anything. It is not
 * a toast (sk-toast exists and is floating) and it is not a dialog; a message
 * that needs to interrupt over everything on screen belongs to those
 * components, not to this one.
 *
 * It owns no state and deliberately has no dismiss button: a dismissible
 * message needs a close affordance, a focus move into that affordance, and a
 * focus return when it goes away — which is a different component with its own
 * contract. This component only ever states; it never hides itself.
 */

@Component({
  tag: "sk-alert",
  // ADR-011: scoped styles, not Shadow DOM. An alert's bars and fills are
  // exactly what a consumer restyles most, and a shadow root would block it.
  scoped: true,
  shadow: false,
})
export class SkAlert {
  @Element() host!: HTMLElement

  /**
   * Visual emphasis.
   *
   * Only `variant` is an appearance prop. The variant also picks the component's
   * default live-region role, unless the consumer has already set one.
   */
  @Prop({ reflect: true }) variant: "neutral" | "primary" | "success" | "warning" | "danger" =
    "neutral"

  /**
   * Heading text for the alert, rendered as a `<span>`.
   *
   * Named `heading`, not `title`, for the reason sk-card records: `title` is a
   * standardized `HTMLElement` member and a prop by that name is shadowed by
   * the prototype property, so the browser would surface it as a hover tooltip
   * on the whole alert.
   *
   * A string rather than a heading element: the alert does not know what level
   * it sits at in the document's outline, and a hard-coded heading inside it
   * produces a level that may contradict the surrounding structure. A consumer
   * who needs a real heading puts one in the body itself.
   */
  @Prop() heading = ""

  componentWillRender() {
    // Role comes from the variant unless the consumer has already set one —
    // `hasAttribute` rather than a property, because a consumer fits this most
    // naturally via markup. An error appearing in place should interrupt, so
    // `danger` and `warning` get `role="alert"`; a success line should not, so
    // everything else gets `role="status"`. Never overwriting a consumer's
    // choice is what makes a custom live region (say, `role="log"`) usable here.
    if (!this.host.hasAttribute("role")) {
      this.host.setAttribute(
        "role",
        this.variant === "danger" || this.variant === "warning" ? "alert" : "status",
      )
    }
  }

  render() {
    return (
      <Host data-slot="alert" data-variant={this.variant}>
        {/*
          The glyph is decorative drawing: it repeats what the fill and the
          text already say, so it is hidden from the accessibility tree. It
          exists so colour is never the only signal (WCAG 1.4.1).
        */}
        <span class="sk-alert__icon" data-slot="icon" aria-hidden="true" />

        <span class="sk-alert__content" data-slot="content">
          {this.heading ? (
            <span class="sk-alert__heading" data-slot="heading">
              {this.heading}
            </span>
          ) : null}
          <span class="sk-alert__body" data-slot="body">
            <slot />
          </span>
        </span>

        {/*
          The actions wrapper always renders and is removed by CSS when the
          slot is unfilled (`:empty` matches, because CSS ignores the comment
          nodes scoped-mode rendering leaves behind).
        */}
        <span class="sk-alert__actions" data-slot="actions">
          <slot name="actions" />
        </span>
      </Host>
    )
  }
}
