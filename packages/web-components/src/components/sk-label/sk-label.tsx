import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Label — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The wiring here is the pattern `sk-input` proved in a real browser: the label
 * is associated with its control through `htmlFor` pointing at the control's id,
 * and clicking the label focuses the control because the browser's own label
 * activation does it — this component implements no click handler, because the
 * platform's is better and reimplementing it would mean reimplementing the
 * edge cases too.
 *
 * The required marker is `aria-hidden` and always rendered, even when a
 * screen-reader user cannot see it, because the `required` attribute on the
 * control carries the semantics; the asterisk is for the sighted. Color alone
 * never carries the requirement — WCAG 1.4.1, the same ruling Input made.
 */

@Component({
  tag: "sk-label",
  scoped: true,
  shadow: false,
})
export class SkLabel {
  /**
   * The `id` of the control this label names. Required for the same reason
   * Link's `href` is: a label with no `for` is a mistake the compiler catches,
   * and passing `""` explicitly is the visible way to say "decorative label".
   *
   * Named `for`, not `htmlFor`. Stencil maps a camelCase prop to its kebab
   * attribute (`htmlFor` → `html-for`), so a consumer writing the HTML attribute
   * `for` — the only spelling that exists in plain markup — would set nothing,
   * and the label would silently associate with nothing. The first build proved
   * it: `for="standalone-email"` in the page, `for=""` in the DOM. The native
   * `for` attribute name is also what `Element.prototype` reserves, so a prop
   * named `for` would collide with it — hence `for` as the *attribute* via
   * `@Prop({ attribute: "for" })` on a differently-named field.
   */
  @Prop({ attribute: "for" }) forId = ""

  /**
   * Marks the labeled control as required and renders the marker.
   *
   * This sets `aria-required` on **this** element, not the control — the
   * consumer sets `required` on the control itself, and the label marking the
   * control on its behalf would be a second component reaching into another's
   * DOM, which §4 forbids.
   */
  @Prop({ reflect: true }) required = false

  /**
   * Where the marker sits. `before` reads naturally for checkboxes and
   * switches, where the control leads the sentence.
   */
  @Prop({ reflect: true }) marker: "after" | "before" = "after"

  render() {
    return (
      <Host data-slot="label-wrapper">
        {this.required && this.marker === "before" ? (
          <span class="sk-label__required" data-slot="required" aria-hidden="true">
            *
          </span>
        ) : null}
        <label class="sk-label__label" data-slot="label" htmlFor={this.forId}>
          <slot />
        </label>
        {this.required && this.marker === "after" ? (
          <span class="sk-label__required" data-slot="required" aria-hidden="true">
            *
          </span>
        ) : null}
      </Host>
    )
  }
}
