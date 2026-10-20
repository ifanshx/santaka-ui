import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Field — Tier 1 form component: the wrapper that labels, describes, and marks a
 * control it does not own.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * `sk-input`, `sk-textarea`, and `sk-select` each render their own label,
 * description, and error. That is right for a self-contained control and wrong
 * the moment the control is *not one of ours* — a consumer's `<input>`, a
 * third-party widget, or several controls under one label. This component exists
 * for exactly that case, and the boundary is the point:
 *
 * **It describes; it does not control.** The field owns the label, the
 * description, the error, and the ARIA wiring that points at them. It never
 * reads or writes the control's value, never sets `name`, and never calls
 * `setFormValue` — the control is not form-associated through this wrapper. A
 * wrapper that also tried to own the value would be a second owner of it, and
 * the two would eventually disagree, which is the failure §4's "exactly one
 * implementation owns the behavior" rule exists to prevent.
 *
 * ### The only attributes it sets on the control
 *
 * ARIA association is not optional and not the consumer's job to guess:
 * `aria-labelledby`, `aria-describedby`, `aria-invalid`, and `aria-required`
 * have to sit on the *control*, because that is the element a screen reader is
 * on when it announces them. So the field finds the first control in its slot
 * and sets those four, and nothing else. They are description;
 * `value`, `name`, `disabled`, and validity stay the control's own business.
 *
 * The label is associated by id rather than by wrapping: the control is the
 * consumer's, and a `<label>` wrapping an element this component did not render
 * would make the association indirect and fragile under re-renders.
 *
 * §4 requires the error id to be **appended** to any existing description rather
 * than replacing it — an error that silences the hint removes the format
 * instruction exactly when the user needs it.
 */
@Component({
  tag: "sk-field",
  scoped: true,
  shadow: false,
})
export class SkField {
  /** The custom element itself. Public so the render can find the control. */
  @Element() host!: HTMLElement

  /** Label text. Becomes the accessible name of the control inside. */
  @Prop() label = ""

  /** Persistent helper text, announced through `aria-describedby`. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /** Marks the field invalid independently of whether `error` is set. */
  @Prop({ reflect: true }) invalid = false

  /** Marks the field required. Announced through `aria-required` on the control. */
  @Prop({ reflect: true }) required = false

  /** Announces the field as disabled. Does not disable the control itself. */
  @Prop({ reflect: true }) disabled = false

  private get isInvalid(): boolean {
    return this.invalid || this.error.length > 0
  }

  private get suffix(): string {
    const hostId = this.host.getAttribute("id")
    if (hostId) return hostId
    const control = this.findControl()
    return `sk-field-${(control?.id || control?.tagName || "control").toLowerCase()}`
  }

  /**
   * The first form control in the slot, or null when the consumer has not put
   * one there yet.
   *
   * Queried rather than tracked: the control is the consumer's and is present in
   * the light DOM at render time. `data-santaka-field-control` marks the element
   * this field has already claimed, so a re-render adopts the same one instead
   * of racing a control the consumer added later.
   */
  private findControl(): HTMLElement | null {
    const claimed = this.host.querySelector<HTMLElement>("[data-santaka-field-control]")
    if (claimed) return claimed

    const control = this.host.querySelector<HTMLElement>(
      "input, select, textarea, sk-input, sk-textarea, sk-select, sk-checkbox, sk-switch, sk-radio-group",
    )
    control?.setAttribute("data-santaka-field-control", "")
    return control ?? null
  }

  /** Set the four descriptive attributes on the control, and nothing else. */
  private syncControl(base: string) {
    const control = this.findControl()
    if (!control) return

    const labelId = `${base}-label`
    const descriptionId = `${base}-description`
    const errorId = `${base}-error`

    if (this.label) control.setAttribute("aria-labelledby", labelId)
    else control.removeAttribute("aria-labelledby")

    const ids: string[] = []
    if (this.description) ids.push(descriptionId)
    if (this.error) ids.push(errorId)
    if (ids.length > 0) control.setAttribute("aria-describedby", ids.join(" "))
    else control.removeAttribute("aria-describedby")

    if (this.isInvalid) control.setAttribute("aria-invalid", "true")
    else control.removeAttribute("aria-invalid")

    if (this.required) control.setAttribute("aria-required", "true")
    else control.removeAttribute("aria-required")
  }

  render() {
    const base = this.suffix
    this.syncControl(base)

    return (
      <Host
        data-slot="field"
        data-invalid={this.isInvalid ? "" : undefined}
        data-disabled={this.disabled ? "" : undefined}
      >
        <span class="sk-field__label-row" data-slot="label-row">
          <span class="sk-field__label" data-slot="label" id={`${base}-label`}>
            {this.label}
          </span>
          {this.required ? (
            <span class="sk-field__required" data-slot="required">
              {/* The asterisk is the visual signal; the word is what is announced. */}
              <span aria-hidden="true">*</span>
              <span class="sk-visually-hidden">required</span>
            </span>
          ) : null}
        </span>

        {this.description ? (
          <span class="sk-field__description" data-slot="description" id={`${base}-description`}>
            {this.description}
          </span>
        ) : null}

        {/* The control lives here and stays the consumer's. */}
        <span class="sk-field__control" data-slot="control">
          <slot />
        </span>

        {this.error ? (
          <span class="sk-field__error" data-slot="error" id={`${base}-error`}>
            {/*
              The glyph keeps this from being colour alone (WCAG 1.4.1). It is
              hidden because the message text beside it already says it.
            */}
            <span class="sk-field__error-icon" aria-hidden="true" />
            {this.error}
          </span>
        ) : null}
      </Host>
    )
  }
}
