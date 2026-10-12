import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Card — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * A card is a surface, not a control. It owns no state, exposes no role, and is
 * not focusable — a clickable card is a link or a button with a card's styling
 * on it, and pretending otherwise produces a thing that is neither reachable by
 * keyboard nor announced. The registry entry for this component says so, and it
 * is the reason this component has no interaction props at all.
 *
 * Composition follows §4: Web Components use named slots. So the parts are
 * `header`, the default slot for the body, and `footer`, each optional, and each
 * rendered only when the consumer actually filled it — an empty bordered header
 * is worse than no header.
 */

@Component({
  tag: "sk-card",
  // ADR-011: scoped styles, not Shadow DOM. A card is exactly the element a
  // consumer most often wants to restyle from their own CSS, and a shadow root
  // would make that impossible.
  scoped: true,
  shadow: false,
})
export class SkCard {
  /**
   * Visual emphasis.
   *
   * `default` is the raised, hard-edged surface every other chrome component
   * matches. `outlined` drops the fill for a card that sits inside another
   * surface, where two competing fills would fight. `bare` drops the shadow too,
   * for a card that is grouped rather than elevated.
   */
  @Prop({ reflect: true }) variant: "default" | "outlined" | "bare" = "default"

  /**
   * The card's inner padding.
   *
   * Not the `size` prop, because `size` is the height scale every other
   * component uses and a card has no intrinsic height: it is whatever its
   * content makes it. Padding is the axis a card actually varies on.
   */
  @Prop({ reflect: true }) padding: "none" | "sm" | "md" | "lg" = "md"

  /**
   * Heading text for the card, rendered in the header.
   *
   * Named `heading`, not `title`. `title` is a standardized `HTMLElement`
   * member, and a prop by that name shadows the prototype property, so the
   * browser would show this text as a hover tooltip on the entire card — a
   * second, invisible copy of the heading appearing on hover. Stencil warns
   * about this by name.
   *
   * A string rather than a heading element: the card does not know what level it
   * sits at in the document's outline, and a hard-coded `<h3>` inside a card in
   * an `<h2>` section produces a heading level that contradicts the surrounding
   * structure. A consumer who needs a real heading passes one in the `header`
   * slot instead.
   */
  @Prop() heading = ""

  /** Supporting text under the heading. */
  @Prop() subtitle = ""

  render() {
    return (
      <Host data-slot="card">
        {/*
          The header's fallback renders only when the header slot is empty, which
          is what keeps a card without a header from carrying an empty bordered
          band above its body.
        */}
        <slot name="header">
          {this.heading || this.subtitle ? (
            <div class="sk-card__header" data-slot="header">
              {this.heading ? (
                <span class="sk-card__heading" data-slot="heading">
                  {this.heading}
                </span>
              ) : null}
              {this.subtitle ? (
                <span class="sk-card__subtitle" data-slot="subtitle">
                  {this.subtitle}
                </span>
              ) : null}
            </div>
          ) : null}
        </slot>

        <div class="sk-card__body" data-slot="body">
          <slot />
        </div>

        <div class="sk-card__footer" data-slot="footer">
          <slot name="footer" />
        </div>
      </Host>
    )
  }
}
