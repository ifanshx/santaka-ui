import { Component, Element, h, Host, Prop, State, Watch } from "@stencil/core"
import {
  createFieldWiring,
  type FieldWiring,
  isFieldInvalid,
  setupFormControl,
  syncFormControl,
  type FormControlAccessors,
  type TextControl,
} from "../shared/form-control-base.js"

/**
 * Input — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * Form participation is the whole point of this component, so it is a
 * form-associated custom element (FACE): `attachInternals()`, `setFormValue()` on
 * every change, and all three callbacks the contract requires. A control that
 * cannot submit through a plain `<form>` is not shippable (section 4). That
 * behavior lives in `shared/form-control-base.ts`, shared with `sk-textarea`.
 *
 * Validation is deliberately *native*. `required`, `minlength`, `maxlength`, and
 * `pattern` become real attributes on the inner `<input>`, so the browser does
 * the checking, the error bubble appears in the browser's own language, and
 * `:invalid` styling works without JavaScript. The shared `validate()` rules in
 * `@santaka-ui/utilities` exist for the cases a form control *cannot* express —
 * cross-field checks, async checks — and are not duplicated here.
 */

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url" | "number"

@Component({
  tag: "sk-input",
  // ADR-011: scoped styles, not Shadow DOM. A shadow root would kill every
  // consumer utility class and override written against the internals — and for
  // a form control it would also hide the inner <input> from the page's own form
  // handling, which defeats the point.
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkInput {
  /** Native input type. Visual configuration stays `variant`/`size` only. */
  @Prop({ reflect: true }) type: InputType = "text"

  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "default" | "quiet" = "default"

  /** Control height. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /** The control's own label text, rendered above the field. */
  @Prop() label = ""

  /** Persistent helper text below the field. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /**
   * Marks the field invalid.
   *
   * Separate from `error` on purpose: a field can be invalid before the consumer
   * knows why, and an error message can be present without the field being in an
   * error state — for example a form-level summary listing several fields.
   */
  @Prop({ reflect: true }) invalid = false

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /**
   * Makes the field non-editable but still submitted and focusable.
   *
   * Attribute-observed, unlike `disabled`: the HTML attribute name is `readonly`
   * in every case, so Stencil's camelCase-to-kebab mapping cannot be relied on
   * to match it, and a consumer writing `<sk-input readonly>` in plain HTML was
   * silently getting an editable field.
   */
  @Prop({ reflect: true, attribute: "readonly" }) readOnly = false

  /** Native constraint validation still applies and is never suppressed. */
  @Prop({ reflect: true }) required = false

  /** Autocomplete hint for the browser and password managers. */
  @Prop() autocomplete?: string

  /** Placeholder text. Never a substitute for a label. */
  @Prop() placeholder = ""

  /** Associates the control with a form it is not nested inside. */
  @Prop({ reflect: true }) form?: string

  /** The value. Uncontrolled by default: typed value only if set. */
  @Prop({ reflect: true }) value = ""

  /** Initial value for the uncontrolled case. */
  @Prop() defaultValue = ""

  /** Minimum accepted length, enforced natively. */
  @Prop({ reflect: true }) minLength?: number

  /** Maximum accepted length, enforced natively. */
  @Prop({ reflect: true }) maxLength?: number

  /** Regular expression the value must match, enforced natively. */
  @Prop({ reflect: true }) pattern = ""

  /** True when the field has no value, for the placeholder's sake. */
  @State() empty = true

  /** The custom element itself. Public so the shared wiring can drive it. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private input?: TextControl
  private teardown?: () => void
  private wiring!: FieldWiring

  /** Accessors onto this component, for the shared form-control base. */
  private get accessors(): FormControlAccessors {
    return {
      host: this.host,
      control: () => this.input,
      internals: () => this.internals,
      disabled: () => this.disabled,
      readOnly: () => this.readOnly,
      value: () => this.value,
      setValue: (value) => this.setValue(value),
      resetValue: () => this.resetValue(),
      restoreValue: (value) => this.setValue(value),
      setDisabled: (disabled) => {
        if (disabled !== this.disabled) this.disabled = disabled
      },
      onValueChanged: (value) => {
        this.empty = value === ""
      },
    }
  }

  componentWillLoad() {
    // Assigned here, not as a field initializer: a field initializer runs in the
    // constructor, before Stencil assigns `this.host`.
    this.wiring = createFieldWiring(this.host, "sk-input")
    this.internals = this.host.attachInternals()
    // The element may upgrade after the form was parsed, so the initial value is
    // read from the attribute rather than assumed empty.
    if (!this.value && this.host.hasAttribute("value")) {
      this.value = this.host.getAttribute("value") ?? ""
    }
    if (!this.defaultValue && this.host.hasAttribute("value")) {
      this.defaultValue = this.host.getAttribute("value") ?? ""
    }
    this.empty = this.value === ""

    this.teardown = setupFormControl(this.accessors)
    this.sync()
  }

  disconnectedCallback() {
    this.teardown?.()
  }

  componentDidRender() {
    this.input = (this.host.querySelector("input") as HTMLInputElement | null) ?? undefined
    this.sync()
  }

  /** Writes the value and pushes it to the form. */
  private setValue(value: string) {
    this.value = value
    this.empty = value === ""
    this.sync()
  }

  private resetValue() {
    this.setValue(this.defaultValue)
  }

  private sync() {
    syncFormControl(this.accessors)
  }

  /** Resets to the initial value. The contract requires this callback. */
  formResetCallback() {
    this.resetValue()
  }

  /** Reflects a disabled ancestor fieldset. The contract requires this. */
  formDisabledCallback(disabled: boolean) {
    this.accessors.setDisabled(disabled)
    this.sync()
  }

  /** Restores autofill and bfcache values. The contract requires this. */
  formStateRestoreCallback(state: string, mode: string) {
    if (mode === "restore") this.accessors.restoreValue(state)
  }

  /**
   * A programmatic value change must not fire a change event (section 4), but it
   * must still reach the form and the rendered control.
   */
  @Watch("value")
  onValueChange(next: string, previous: string) {
    if (next === previous) return
    if (this.input && this.input.value !== next) this.input.value = next
    this.empty = next === ""
    this.sync()
  }

  render() {
    const controlId = this.wiring.controlId()
    const describedBy = this.wiring.describedBy(this.description, this.error)
    const ariaInvalid = isFieldInvalid(this.invalid, this.error)

    return (
      <Host data-slot="field" data-invalid={ariaInvalid ? "" : undefined}>
        {this.label ? (
          <label class="sk-input__label" data-slot="label" htmlFor={controlId}>
            {this.label}
            {this.required ? (
              <span class="sk-input__required" data-slot="required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        {/*
          A real native <input>, not a div with role="textbox". That is what makes
          native constraint validation, password managers, autofill, IME
          composition, and the browser's own error bubble work — none of which a
          custom element can reimplement correctly.
        */}
        <input
          class="sk-input__control"
          data-slot="control"
          ref={(el) => (this.input = (el ?? undefined) as HTMLInputElement | undefined)}
          id={controlId}
          type={this.type}
          value={this.value}
          placeholder={this.placeholder || undefined}
          autocomplete={this.autocomplete || undefined}
          disabled={this.disabled}
          readOnly={this.readOnly}
          required={this.required}
          minlength={this.minLength}
          maxlength={this.maxLength}
          pattern={this.pattern || undefined}
          aria-invalid={ariaInvalid ? "true" : undefined}
          aria-describedby={describedBy}
          // The inner control is the labelled element; the host must not be a
          // second tab stop or it would double every tab sequence.
          tabindex={this.disabled ? -1 : undefined}
        />

        {/*
          WCAG 1.4.1: a validation message is never conveyed by color alone, so
          the error carries an icon and text, not just a red border.
        */}
        {this.error ? (
          <p class="sk-input__error" data-slot="error" id={this.wiring.errorId}>
            <svg
              class="sk-input__error-icon"
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
          <p class="sk-input__description" data-slot="description" id={this.wiring.descriptionId}>
            {this.description}
          </p>
        ) : null}
      </Host>
    )
  }
}
