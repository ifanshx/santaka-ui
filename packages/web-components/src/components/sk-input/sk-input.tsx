import { Component, Element, h, Host, Prop, State, Watch } from "@stencil/core"
import { nextId } from "@santaka-ui/utilities"

/**
 * Input — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * Form participation is the whole point of this component, so it is a
 * form-associated custom element (FACE): `attachInternals()`, `setFormValue()` on
 * every change, and all three callbacks the contract requires —
 * `formResetCallback`, `formDisabledCallback`, and `formStateRestoreCallback`.
 * A control that cannot submit through a plain `<form>` is not shippable
 * (section 4).
 *
 * Validation is deliberately *native*. `required`, `minLength`, `maxLength`, and
 * `pattern` become real attributes on the inner `<input>`, so the browser does
 * the checking, the error bubble appears in the browser's own language, and
 * `:invalid` styling works without JavaScript. The shared `validate()` rules in
 * `@santaka-ui/utilities` exist for the cases a form control *cannot* express —
 * cross-field checks, async checks — and are not duplicated here.
 */

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url" | "number"

/** The state the shared label/description/error wiring reads. */
export type InputState = {
  host: HTMLElement
  input: HTMLInputElement | undefined
  internals: ElementInternals | undefined
  disabled: boolean
  readOnly: boolean
  required: boolean
  invalid: boolean
}

@Component({
  tag: "sk-input",
  // ADR-011: scoped styles, not Shadow DOM. A shadow root would kill every
  // consumer utility class and override written against the internals — and for
  // a form control it would also hide the inner <input> from the page's own
  // form handling, which defeats the point.
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
   * error state — for example a form-level summary that lists several fields.
   */
  @Prop({ reflect: true }) invalid = false

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /**
   * Makes the field non-editable but still submitted and focusable.
   *
   * Attribute-observed, unlike `disabled`: the HTML attribute name is
   * `readonly` in every case, so Stencil's camelCase-to-kebab mapping cannot be
   * relied on to match it, and a consumer writing `<sk-input readonly>` in plain
   * HTML was silently getting an editable field.
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

  /** Hint rendered when the field is empty, before the user has typed. */
  @State() empty = true

  /** The custom element itself. Public so the shared wiring can drive it. */
  @Element() host!: HTMLElement

  /** Generated ids, resolved once so description/error wiring stays stable. */
  private descriptionId = nextId("sk-description")
  private errorId = nextId("sk-error")
  private generatedId = nextId("sk-input")

  private internals?: ElementInternals
  private input?: HTMLInputElement
  private teardown?: () => void

  /**
   * The value last *reported* to the consumer through `sk-value-change`.
   *
   * Section 4 requires that a change event fires only for user-initiated
   * changes. A flag set around a programmatic write is the obvious way to do
   * that, and it is wrong: the write and the user's next keystroke can land in
   * the same tick, and the flag then suppresses a genuine edit. Comparing
   * against the last reported value states the rule directly — an event means
   * "the value you last saw has changed" — and carries no timing dependency.
   */
  private reportedValue?: string

  componentWillLoad() {
    this.internals = this.host.attachInternals()
    // The element may upgrade after the form was parsed, so the initial value is
    // read from the attribute rather than assumed empty.
    if (!this.value && this.host.hasAttribute("value")) {
      this.value = this.host.getAttribute("value") ?? ""
    }
    if (!this.defaultValue && this.host.hasAttribute("value")) {
      this.defaultValue = this.host.getAttribute("value") ?? ""
    }

    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement
      this.value = target.value
      this.empty = target.value === ""
    }

    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement
      this.value = target.value
      this.empty = target.value === ""

      // Section 4: a change event fires only when the value the consumer last
      // saw has changed. A programmatic `value` assignment updates this field
      // without going through the control, so nothing is reported and a
      // controlled component cannot loop on its own update.
      if (this.reportedValue === target.value) return
      this.reportedValue = target.value

      this.host.dispatchEvent(
        new CustomEvent("sk-value-change", {
          detail: { value: target.value },
          bubbles: true,
          composed: true,
        }),
      )
    }

    // Delegated rather than bound to the input, because the input is re-rendered
    // and a listener bound to the old node would be lost.
    this.host.addEventListener("input", onInput)
    this.host.addEventListener("change", onChange)
    this.teardown = () => {
      this.host.removeEventListener("input", onInput)
      this.host.removeEventListener("change", onChange)
    }

    this.sync()
  }

  disconnectedCallback() {
    this.teardown?.()
  }

  componentDidRender() {
    this.input = this.host.querySelector("input") ?? undefined
    this.sync()
  }

  /**
   * A disabled control must not submit, and a form reset must return the field to
   * its initial value — both are contract requirements rather than conveniences,
   * because a field that submits after being disabled corrupts the submission.
   */
  private sync() {
    if (!this.internals) return

    if (this.disabled) {
      this.internals.setFormValue(null)
    } else {
      this.internals.setFormValue(this.value)
    }

    if (this.readOnly) {
      // A read-only field is not a constraint violation; it is simply not
      // editable, so reporting it invalid would be wrong.
      this.internals.setValidity({})
    } else if (this.input) {
      // `validationMessage` lives on the input, not on `ValidityState`; the state
      // object only carries the flags. The browser's own message is passed
      // through so the error bubble is in the user's language rather than
      // whatever this component would hard-code.
      const native = this.input.validity
      if (native.valid) {
        this.internals.setValidity({})
      } else {
        this.internals.setValidity(native, this.input.validationMessage, this.input)
      }
    } else {
      this.internals.setValidity({})
    }
  }

  /** Resets to the initial value. The contract requires this callback. */
  formResetCallback() {
    this.value = this.defaultValue
    this.empty = this.value === ""
    this.sync()
  }

  /** Reflects a disabled ancestor fieldset. The contract requires this. */
  formDisabledCallback(disabled: boolean) {
    if (disabled !== this.disabled) {
      this.disabled = disabled
      this.sync()
    }
  }

  /** Restores autofill and bfcache values. The contract requires this. */
  formStateRestoreCallback(state: string, mode: string) {
    if (mode === "restore") {
      this.value = state
      this.empty = this.value === ""
      this.sync()
    }
  }

  /**
   * A programmatic value change must not fire a change event (section 4), but it
   * must still reach the form and the rendered input.
   */
  @Watch("value")
  onValueChange(next: string, previous: string) {
    if (next === previous) return
    if (this.input && this.input.value !== next) this.input.value = next
    this.empty = next === ""
    // `reportedValue` is deliberately *not* seeded here: this watcher fires for
    // a user's keystroke too, since `onInput` assigns `value`. Seeding it would
    // make every real edit look already-reported.
    this.sync()
  }

  /** The ids that describe this field, for `aria-describedby`. */
  private describedBy(): string | undefined {
    const ids: string[] = []
    if (this.description) ids.push(this.descriptionId)
    if (this.error) ids.push(this.errorId)
    return ids.length > 0 ? ids.join(" ") : undefined
  }

  /**
   * The id the inner `<input>` carries.
   *
   * When the consumer supplies an id, the *control* gets a derived one rather
   * than the host reusing it verbatim: giving the host and its inner input the
   * same id would make `document.getElementById` ambiguous, and a `<label for>`
   * pointing at that id would resolve to whichever element came first — the
   * host — so clicking the label would focus nothing.
   *
   * A separate `Label` component targets the control through this id, which is
   * the same string the rendered `<label>` uses, so the association holds
   * whichever path a consumer takes.
   */
  private inputId(): string {
    const hostId = this.host.getAttribute("id")
    return hostId ? `${hostId}-control` : this.generatedId
  }

  render() {
    const describedBy = this.describedBy()
    const showError = this.error !== ""
    // `aria-invalid` follows either signal, so a consumer that sets one without
    // the other still produces a correct accessible state.
    const ariaInvalid = this.invalid || showError

    return (
      <Host data-slot="field" data-invalid={ariaInvalid ? "" : undefined}>
        {this.label ? (
          <label class="sk-input__label" data-slot="label" htmlFor={this.inputId()}>
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
          ref={(el) => (this.input = el as HTMLInputElement | undefined)}
          id={this.inputId()}
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
          // The inner input is the labelled control; the host must not be a
          // second tab stop or it would double every tab sequence.
          tabindex={this.disabled ? -1 : undefined}
        />

        {/*
          WCAG 1.4.1: a validation message is never conveyed by color alone, so
          the error carries an icon and text, not just a red border.
        */}
        {showError ? (
          <p class="sk-input__error" data-slot="error" id={this.errorId}>
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

        {this.description && !showError ? (
          <p class="sk-input__description" data-slot="description" id={this.descriptionId}>
            {this.description}
          </p>
        ) : null}
      </Host>
    )
  }
}
