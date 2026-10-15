import { Component, Element, h, Host, Prop, Watch } from "@stencil/core"
import { createFieldWiring, isFieldInvalid, type FieldWiring } from "../shared/form-control-base.js"

/**
 * Switch — Tier 2, the second of the three missing form controls.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * A switch is the checkbox contract under a different role. It renders a real
 * native `<input type="checkbox">` carrying `role="switch"`, which is what the
 * ARIA authoring practices direct: the platform still owns FACE, the
 * Space-to-toggle behavior, constraint validation through `required`, and
 * autofill, while assistive technology reads the state as on/off instead of
 * checked/unchecked. Nothing about the form behavior is reimplemented.
 *
 * The distinction from Checkbox is *when* it applies, not what it submits:
 * a switch is an on/off setting that acts immediately, a checkbox is an
 * option collected for a later submit. The registry `ai` block carries that
 * guidance; the contract here is identical on purpose.
 *
 * The visual is the brutalist track-and-thumb, not the native box. The track
 * is a 3px-stroked rectangle (no rounding — chrome is square) with a thumb
 * that slides on the arcade easing; `:checked` moves the thumb and fills the
 * track. Like Checkbox's tick, the state change is drawn in CSS, not shipped
 * as an asset.
 *
 * `sk-value-change` fires only for user-initiated changes (section 4): the
 * native `change` event is the only event path, and a programmatic prop write
 * dispatches none.
 */
@Component({
  tag: "sk-switch",
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkSwitch {
  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "default" | "quiet" = "default"

  /** Label text size. The row target stays 44px at every size. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /** The label text, rendered beside the track. Wraps the control. */
  @Prop() label = ""

  /** Persistent helper text below the row. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /** Marks the field invalid, with the same independence from `error` as Checkbox. */
  @Prop({ reflect: true }) invalid = false

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /** Native constraint validation still applies and is never suppressed. */
  @Prop({ reflect: true }) required = false

  /** Associates the control with a form it is not nested inside. */
  @Prop({ reflect: true }) form?: string

  /**
   * Whether the switch is on. An ARIA-mirroring boolean, so the ARIA name
   * verbatim (ADR-013, decision 1) — not `isOn`.
   */
  @Prop({ reflect: true, mutable: true }) checked = false

  /** Initial state for the uncontrolled case. */
  @Prop({ attribute: "default-checked" }) defaultChecked = false

  /**
   * The submitted value when on. `"on"` is the platform default, kept so a
   * plain form reads exactly what a native checkbox-role=switch would send.
   */
  @Prop({ reflect: true }) value = "on"

  /** The custom element itself. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private input?: HTMLInputElement
  private wiring!: FieldWiring

  /** The last reported state, for the change-event rule — same guard as Checkbox. */
  private reportedChecked: boolean | undefined

  componentWillLoad() {
    // Assigned here, not as a field initializer: a field initializer runs in the
    // constructor, before Stencil assigns `this.host`.
    this.wiring = createFieldWiring(this.host, "sk-switch")
    this.internals = this.host.attachInternals()
    // The element may upgrade after the form was parsed, so the initial state
    // is read from the attribute rather than assumed off. Same sequence as
    // Checkbox, for the same reason.
    if (this.host.hasAttribute("checked") && !this.checked) {
      this.checked = true
    }
    if (this.host.hasAttribute("default-checked") && !this.defaultChecked) {
      this.defaultChecked = true
    }
    if (!this.checked && this.defaultChecked) {
      this.checked = true
    }
    this.reportedChecked = this.checked

    // Delegated to the host, not bound to the control: the control is
    // re-rendered and a listener on the old node would be lost.
    this.host.addEventListener("change", this.onNativeChange)
    this.sync()
  }

  disconnectedCallback() {
    this.host.removeEventListener("change", this.onNativeChange)
  }

  componentDidRender() {
    this.input =
      (this.host.querySelector("input[type='checkbox']") as HTMLInputElement | null) ?? undefined
    this.sync()
  }

  /** The native toggle is the only writer besides the prop. */
  private onNativeChange = () => {
    const next = this.input?.checked ?? false
    this.setChecked(next)
    if (this.reportedChecked === next) return
    this.reportedChecked = next
    this.host.dispatchEvent(
      new CustomEvent("sk-value-change", {
        detail: { checked: next },
        bubbles: true,
        composed: true,
      }),
    )
  }

  /** Writes the state and pushes it to the form. */
  private setChecked(checked: boolean) {
    this.checked = checked
    this.sync()
  }

  private readOnly = () => false

  private resetValue() {
    this.reportedChecked = this.defaultChecked
    this.setChecked(this.defaultChecked)
  }

  private sync() {
    const internals = this.internals
    if (!internals) return
    // An off switch withholds the pair entirely — `setFormValue(null)` means
    // "not successful", the same rule the platform applies to an unchecked
    // checkbox. `setFormValue("")` would submit an empty pair, which is a
    // different (and wrong) submission.
    if (!this.disabled && this.checked) {
      internals.setFormValue(this.value)
    } else {
      internals.setFormValue(null)
    }
    // Validity: required on an off switch is a constraint violation the
    // browser reports itself. Same shape as Checkbox's validity logic.
    if (this.readOnly()) {
      internals.setValidity({})
      return
    }
    const control = this.input
    if (!control) {
      internals.setValidity({})
      return
    }
    if (control.validity.valid) {
      internals.setValidity({})
    } else {
      internals.setValidity(control.validity, control.validationMessage, control)
    }
  }

  /** Resets to the initial state. The contract requires this callback. */
  formResetCallback() {
    this.resetValue()
  }

  /** Reflects a disabled ancestor fieldset. The contract requires this. */
  formDisabledCallback(disabled: boolean) {
    if (disabled !== this.disabled) this.disabled = disabled
    this.sync()
  }

  /**
   * Restores autofill and bfcache values. The contract requires this. The
   * platform restores `"on"` for an on switch and `null` for off.
   */
  formStateRestoreCallback(state: string | null, mode: string) {
    if (mode === "restore") {
      const next = state !== null && state !== ""
      this.reportedChecked = next
      this.setChecked(next)
    }
  }

  /**
   * A programmatic state change must not fire a change event (section 4), but
   * it must still reach the form and the rendered control. The native listener
   * is the only event path, and a prop write dispatches no native event.
   */
  @Watch("checked")
  onCheckedChange(next: boolean) {
    if (this.input && this.input.checked !== next) {
      this.input.checked = next
    }
    this.sync()
  }

  @Watch("value")
  onValueChange() {
    this.sync()
  }

  render() {
    const controlId = this.wiring.controlId()
    const describedBy = this.wiring.describedBy(this.description, this.error)
    const ariaInvalid = isFieldInvalid(this.invalid, this.error)

    return (
      <Host
        data-slot="field"
        data-invalid={ariaInvalid ? "" : undefined}
        data-state={this.checked ? "checked" : "unchecked"}
      >
        {/*
          The label wraps the input, exactly as Checkbox's does: the control
          leads the sentence and the browser's own label activation toggles it,
          so the whole row is the activation target with no click handler.
          `role="switch"` moves the state reading from checked/unchecked to
          on/off; the native input keeps no aria-checked of its own because the
          role already exposes the state and a second source would diverge.
        */}
        <label class="sk-switch__label" data-slot="label" htmlFor={controlId}>
          <input
            class="sk-switch__control"
            data-slot="control"
            ref={(el) => (this.input = (el ?? undefined) as HTMLInputElement | undefined)}
            id={controlId}
            type="checkbox"
            role="switch"
            checked={this.checked}
            value={this.value}
            disabled={this.disabled}
            required={this.required}
            aria-invalid={ariaInvalid ? "true" : undefined}
            aria-describedby={describedBy}
          />
          <span class="sk-switch__track" data-slot="track" aria-hidden="true">
            <span class="sk-switch__thumb" data-slot="thumb" />
          </span>
          <span class="sk-switch__text" data-slot="text">
            {this.label}
            {this.required ? (
              <span class="sk-switch__required" data-slot="required" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
        </label>

        {/*
          WCAG 1.4.1: a validation message is never conveyed by color alone, so
          the error carries an icon and text, not just a red border.
        */}
        {this.error ? (
          <p class="sk-switch__error" data-slot="error" id={this.wiring.errorId}>
            <svg
              class="sk-switch__error-icon"
              data-slot="error-icon"
              viewBox="0 0 16 16"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M8 4.5v4.5M8 11.2v.6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <span>{this.error}</span>
          </p>
        ) : null}

        {this.description && !this.error ? (
          <p class="sk-switch__description" data-slot="description" id={this.wiring.descriptionId}>
            {this.description}
          </p>
        ) : null}
      </Host>
    )
  }
}
