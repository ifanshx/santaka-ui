import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Empty state — Tier 1 placeholder surface.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * Like sk-card, this is a surface, not a control: it owns no state, exposes no
 * role, and is not focusable. The section outline is the document's business —
 * the consumer labels the section with a real heading and this component
 * renders plain text, for the same reason sk-card's heading is a `<span>`.
 *
 * `variant="bare"` exists for an empty state that sits inside a card: the card
 * already draws the boundary, and a second stroke with its own shadow inside it
 * is two competing surfaces fighting for the same wall.
 */
@Component({
  tag: "sk-empty-state",
  // ADR-011: scoped styles, not Shadow DOM. A placeholder is exactly the thing
  // a consumer wants to restyle from their own CSS.
  scoped: true,
  shadow: false,
})
export class SkEmptyState {
  /**
   * Visual treatment.
   *
   * `default` is the stroked, shadowed surface. `bare` drops the fill, the
   * stroke and the shadow for an empty state nested inside another surface,
   * where two competing boundaries would fight.
   */
  @Prop({ reflect: true }) variant: "default" | "bare" = "default"

  /**
   * Density axis: block padding and glyph size. `md` is the default because an
   * empty state usually fills the whole area left by the missing content.
   */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /**
   * Plain text in a `<span>`, not a heading element. This component does not
   * know what level it sits at in the document's outline, and a hard-coded
   * heading inside it contradicts the surrounding structure. Decision shared
   * with sk-card.
   */
  @Prop() heading = ""

  /** Supporting text under the heading. */
  @Prop() description = ""

  render() {
    return (
      <Host data-slot="empty-state">
        {/*
          The icon slot's fallback is a CSS-drawn glyph, hidden from assistive
          tech the same way any decorative drawing is.
        */}
        <div class="sk-empty-state__icon" data-slot="icon" aria-hidden="true">
          <slot name="icon">
            <span class="sk-empty-state__glyph" />
          </slot>
        </div>

        <div class="sk-empty-state__content" data-slot="content">
          {this.heading ? (
            <span class="sk-empty-state__heading" data-slot="heading">
              {this.heading}
            </span>
          ) : null}
          {this.description ? (
            <span class="sk-empty-state__description" data-slot="description">
              {this.description}
            </span>
          ) : null}

          {/*
            The default slot carries extra body content a consumer thinks an
            empty state needs beyond heading and description.
          */}
          <div class="sk-empty-state__body" data-slot="body">
            <slot />
          </div>
        </div>

        {/*
          The actions wrapper always exists so the consumer's slotted button
          lands here; an unfilled one is removed by CSS (`:empty { display:
          none }`) rather than by the template, because scoped-mode rendering
          leaves comment nodes behind that a template cannot see around.
        */}
        <div class="sk-empty-state__actions" data-slot="actions">
          <slot name="actions" />
        </div>
      </Host>
    )
  }
}
