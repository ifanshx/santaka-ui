import { Component, Element, h, Host, Prop, State, Watch } from "@stencil/core"
import {
  createFieldWiring,
  isFieldInvalid,
  setupFormControl,
  syncFormControl,
  type FormControlAccessors,
  type TextControl,
} from "../shared/form-control-base.js"

/**
 * Textarea — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * A textarea is an input with a different rendered element, and that is exactly
 * what it is here: the form contract, validation reporting, label wiring, and
 * change-event rule all live in `shared/form-control-base.ts`, shared with
 * `sk-input`. A second copy would be a second thing to fix the moment
 * accessibility behavior changed.
 *
 * The differences are the ones the element demands, not decoration:
 *
 *  - `rows` and `cols` are what size a textarea. There is no `size` in the
 *    Button sense, so this component takes `rows` and leaves the visual axis to
 *    the one the browser already understands.
 *  - `<textarea>` takes its initial content as *children*, not a `value`
 *    attribute, so the fallback path for plain HTML is the text content.
 *  - `pattern` does not apply to a textarea at all. Long-form text has no
 *    single-line grammar, so the prop is absent rather than accepted and
 *    ignored.
 */

@Component({
  tag: "sk-textarea",
  // ADR-011: scoped styles, not Shadow DOM — a shadow root would also hide the
  // inner <textarea> from the page's own form handling.
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkTextarea {
  /** Visible rows. The browser's own sizing, not a pixel value. */
  @Prop({ reflect: true }) rows = 4

  /** Visible columns, for the few cases where it matters. */
  @Prop({ reflect: true }) cols?: number

  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "default" | "quiet" = "default"

  /** The control's own label text, rendered above the field. */
  @Prop() label = ""

  /** Persistent helper text below the field. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /** Marks the field invalid independently of any error text. */
  @Prop({ reflect: true }) invalid = false

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /**
   * Makes the field non-editable but still submitted and focusable.
   *
   * Attribute-observed, for the same reason as `sk-input`: Stencil's
   * camelCase-to-kebab mapping produces `read-only`, not the native `readonly`.
   */
  @Prop({ reflect: true, attribute: "readonly" }) readOnly = false

  /** Native constraint validation still applies and is never suppressed. */
  @Prop({ reflect: true }) required = false

  /** Placeholder text. Never a substitute for a label. */
  @Prop() placeholder = ""

  /** Associates the control with a form it is not nested inside. */
  @Prop({ reflect: true }) form?: string

  /** The value. Uncontrolled by default: typed value only if set. */
  @Prop({ reflect: true }) value = ""

  /** Initial value for the uncontrolled case. */
  @Prop() defaultValue = ""
  /**
   * Minimum accepted length, enforced natively.
   *
   * Attribute-observed because Stencil's camelCase-to-kebab mapping produces
   * `min-length`, not the native `minlength`, so `<sk-textarea minlength="2">`
   * was silently ignored — the same class of defect `readonly` had.
   */
  @Prop({ reflect: true, attribute: "minlength" }) minLength?: number

  /** Maximum accepted length, enforced natively. Same attribute-name reason. */
  @Prop({ reflect: true, attribute: "maxlength" }) maxLength?: number

  /** True when the field has no value. */
  @State() empty = true

  /** The custom element itself. Public so the shared wiring can drive it. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private textarea?: TextControl
  private teardown?: () => void
  private wiring = createFieldWiring(this.host, "sk-textarea")

  /** Accessors onto this component, for the shared form-control base. */
  private get accessors(): FormControlAccessors {
    return {
      host: this.host,
      control: () => this.textarea,
      internals: () => this.internals,
      disabled: () => this.disabled,
      readOnly: () => this.readOnly,
      value: () => this.value,
      setValue: (value) => this.setValue(value),
      resetValue: () => this.setValue(this.defaultValue),
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
    this.internals = this.host.attachInternals()

    // A <textarea> takes its initial content as children, not as a `value`
    // attribute, so plain HTML sets it that way. Both are read, because a
    // consumer might reasonably write either.
    if (!this.value && this.host.hasAttribute("value")) {
      this.value = this.host.getAttribute("value") ?? ""
    }
    if (!this.value) {
      this.value = this.host.textContent?.trim() ?? ""
    }
    if (!this.defaultValue) {
      this.defaultValue = this.value
    }
    this.empty = this.value === ""

    this.teardown = setupFormControl(this.accessors)
    this.sync()
  }

  disconnectedCallback() {
    this.teardown?.()
  }

  componentDidRender() {
    this.textarea = (this.host.querySelector("textarea") as HTMLTextAreaElement | null) ?? undefined
    this.sync()
  }

  private setValue(value: string) {
    this.value = value
    this.empty = value === ""
    this.sync()
  }

  private sync() {
    syncFormControl(this.accessors)
  }

  formResetCallback() {
    this.setValue(this.defaultValue)
  }

  formDisabledCallback(disabled: boolean) {
    this.accessors.setDisabled(disabled)
    this.sync()
  }

  formStateRestoreCallback(state: string, mode: string) {
    if (mode === "restore") this.accessors.restoreValue(state)
  }

  @Watch("value")
  onValueChange(next: string, previous: string) {
    if (next === previous) return
    if (this.textarea && this.textarea.value !== next) this.textarea.value = next
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
          <label class="sk-textarea__label" data-slot="label" htmlFor={controlId}>
            {this.label}
            {this.required ? (
              <span class="sk-textarea__required" data-slot="required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        {/* A real <textarea>, for the same reasons `sk-input` uses a real <input>. */}
        <textarea
          class="sk-textarea__control"
          data-slot="control"
          ref={(el) => (this.textarea = (el ?? undefined) as HTMLTextAreaElement | undefined)}
          id={controlId}
          rows={this.rows}
          cols={this.cols}
          value={this.value}
          placeholder={this.placeholder || undefined}
          disabled={this.disabled}
          readOnly={this.readOnly}
          required={this.required}
          minlength={this.minLength}
          maxlength={this.maxLength}
          aria-invalid={ariaInvalid ? "true" : undefined}
          aria-describedby={describedBy}
          tabindex={this.disabled ? -1 : undefined}
        />

        {this.error ? (
          <p class="sk-textarea__error" data-slot="error" id={this.wiring.errorId}>
            <svg
              class="sk-textarea__error-icon"
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
          <p
            class="sk-textarea__description"
            data-slot="description"
            id={this.wiring.descriptionId}
          >
            {this.description}
          </p>
        ) : null}
      </Host>
    )
  }
}
