import { Component, Element, h, Host, Prop, State, Watch } from "@stencil/core"
import { createFieldWiring, isFieldInvalid } from "../shared/form-control-base.js"

/**
 * Radio Group — Tier 2, the last of the three missing form controls.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * The architecture decision, mirroring Select's: **it renders real native
 * `<input type="radio">` elements, visibly.** A custom roving-tabindex div
 * with `role="radio"` was rejected deliberately. Native radios give the
 * platform's arrow-key navigation across every group sharing a `name`, the
 * platform's form submission, the platform's constraint validation ("please
 * select one of these options" is the browser's message, not this one), and
 * touch behavior — all for free, and all subtly wrong in a reimplementation.
 *
 * The group is itself form-associated: it owns one `ElementInternals`, and
 * the checked radio's `value` is what `setFormValue()` reports. The group —
 * not the individual radio — carries `name`, `required`, and the error, so
 * the consumer wires one element and the browser validates the set.
 *
 * Keyboard behavior is the browser's: within a checked group, arrow keys move
 * selection; the group is one tab stop. No roving tabindex is implemented
 * here because the native radio group already implements it — this component
 * does not reinvent what `type="radio"` does, it styles it.
 *
 * Options arrive as JSON via the `options` prop — the same contract as
 * Select — because slotted inputs cannot be distributed into the render tree
 * under scoped encapsulation (the Dialog panel's lesson).
 *
 * `sk-value-change` fires only for user-initiated changes (section 4): the
 * native `change` event from a radio is the only event path, and a
 * programmatic prop write dispatches none.
 */
export type RadioOption = {
  value: string
  label: string
  disabled?: boolean
}

@Component({
  tag: "sk-radio-group",
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkRadioGroup {
  /** The choices. Serialized as JSON when written as an attribute. */
  @Prop() options: RadioOption[] = []

  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "default" | "quiet" = "default"

  /** Label text size. The row target stays 44px at every size. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /** The group's own label text, rendered above the options. */
  @Prop() label = ""

  /** Persistent helper text below the group. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /** Marks the field invalid, with the same independence from `error` as Input. */
  @Prop({ reflect: true }) invalid = false

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /** Native constraint validation still applies and is never suppressed. */
  @Prop({ reflect: true }) required = false

  /** Associates the control with a form it is not nested inside. */
  @Prop({ reflect: true }) form?: string

  /** The submitted name. Every radio in the group carries it. */
  @Prop({ reflect: true }) name = ""

  /** The value. Uncontrolled by default; "" means nothing selected. */
  @Prop({ reflect: true }) value = ""

  /** Initial value for the uncontrolled case. */
  @Prop() defaultValue = ""

  @State() private optionsJson: RadioOption[] = []

  /** The custom element itself. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private wiring = createFieldWiring(this.host, "sk-radio-group")

  /** The last reported value, for the change-event rule — same guard as Checkbox. */
  private reportedValue: string | undefined

  componentWillLoad() {
    this.internals = this.host.attachInternals()
    this.optionsJson = this.parseOptions(this.host.getAttribute("options"))
    // The element may upgrade after the form was parsed, so the initial value
    // is read from the attribute rather than assumed empty — the same
    // sequence as Select.
    if (!this.value && this.host.hasAttribute("value")) {
      this.value = this.host.getAttribute("value") ?? ""
    }
    if (!this.defaultValue && this.host.hasAttribute("value")) {
      this.defaultValue = this.host.getAttribute("value") ?? ""
    }
    if (!this.name && this.host.hasAttribute("name")) {
      this.name = this.host.getAttribute("name") ?? ""
    }
    this.reportedValue = this.value

    // Delegated to the host: the radios are re-rendered and a listener bound
    // to an old node would be lost — the same reason the text base delegates.
    this.host.addEventListener("change", this.onNativeChange)
    this.sync()
  }

  disconnectedCallback() {
    this.host.removeEventListener("change", this.onNativeChange)
  }

  componentDidRender() {
    this.sync()
  }

  /**
   * Options arrive as a JSON string when written as an attribute and an array
   * when set as a property. Parsing once here, not on every render.
   */
  private parseOptions(raw: string | null): RadioOption[] {
    if (!raw) return this.options
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // A malformed attribute must not take the whole field down; an empty
      // group with a visible error is better than a blank page.
      return []
    }
  }

  /** The native radio change is the only writer besides the prop. */
  private onNativeChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!(target instanceof HTMLInputElement) || target.type !== "radio") return
    const next = target.value
    this.setValue(next)
    if (this.reportedValue === next) return
    this.reportedValue = next
    this.host.dispatchEvent(
      new CustomEvent("sk-value-change", {
        detail: { value: next },
        bubbles: true,
        composed: true,
      }),
    )
  }

  /** Writes the value, moves the checked state, and pushes it to the form. */
  private setValue(value: string) {
    this.value = value
    // Keep the rendered radios in step with the state: a programmatic write
    // dispatches no native event, so the DOM check must be set here.
    for (const radio of this.radios()) {
      if (radio.value !== value && radio.checked) radio.checked = false
      if (radio.value === value && !radio.checked) radio.checked = true
    }
    this.sync()
  }

  private radios(): HTMLInputElement[] {
    return [...this.host.querySelectorAll<HTMLInputElement>("input[type='radio']")]
  }

  private resetValue() {
    this.reportedValue = this.defaultValue
    this.setValue(this.defaultValue)
  }

  private sync() {
    const internals = this.internals
    if (!internals) return
    // Nothing selected withholds the pair entirely — `setFormValue(null)`
    // means "not successful", the same rule an unchecked checkbox follows.
    // A selected radio submits its value, exactly as a native radio would.
    if (!this.disabled && this.value !== "") {
      internals.setFormValue(this.value)
    } else {
      internals.setFormValue(null)
    }
    // Required on a group with nothing selected is a constraint violation.
    // The checked radio's own validity is the browser's report; with nothing
    // selected, the group itself is valueMissing.
    if (this.disabled) {
      internals.setValidity({})
      return
    }
    const checked = this.radios().find((radio) => radio.checked)
    if (checked) {
      if (checked.validity.valid) {
        internals.setValidity({})
      } else {
        internals.setValidity(checked.validity, checked.validationMessage, checked)
      }
    } else if (this.required) {
      internals.setValidity({ valueMissing: true }, "Please select one of these options.")
    } else {
      internals.setValidity({})
    }
  }

  /** Resets to the initial value. The contract requires this callback. */
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
   * platform restores the selected radio's value, or `null` when nothing was
   * selected.
   */
  formStateRestoreCallback(state: string | null, mode: string) {
    if (mode === "restore") {
      const next = state ?? ""
      this.reportedValue = next
      this.setValue(next)
    }
  }

  /**
   * A programmatic value change must not fire a change event (section 4), but
   * it must still reach the form and the rendered control.
   */
  @Watch("value")
  onValueChange(next: string) {
    for (const radio of this.radios()) {
      const shouldCheck = radio.value === next
      if (radio.checked !== shouldCheck) radio.checked = shouldCheck
    }
    this.sync()
  }

  @Watch("options")
  optionsChanged(next: RadioOption[]) {
    this.optionsJson = Array.isArray(next) ? next : []
  }

  render() {
    const groupId = this.wiring.controlId()
    const describedBy = this.wiring.describedBy(this.description, this.error)
    const ariaInvalid = isFieldInvalid(this.invalid, this.error)

    return (
      <Host data-slot="field" data-invalid={ariaInvalid ? "" : undefined}>
        {this.label ? (
          <span class="sk-radio-group__label" data-slot="label" id={groupId}>
            {this.label}
            {this.required ? (
              <span class="sk-radio-group__required" data-slot="required" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
        ) : null}

        {/*
          A real native radio set, visibly. The platform owns arrow-key
          navigation, one tab stop per group, and constraint validation; the
          rendered part is the styling. `role="radiogroup"` is carried by the
          container so the group's label names it through `aria-labelledby`.
        */}
        <div
          class="sk-radio-group__options"
          data-slot="options"
          role="radiogroup"
          aria-labelledby={this.label ? groupId : undefined}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ? "true" : undefined}
          aria-required={this.required ? "true" : undefined}
        >
          {this.optionsJson.map((option) => (
            <label class="sk-radio-group__option" data-slot="option">
              <input
                class="sk-radio-group__control"
                data-slot="control"
                type="radio"
                name={this.name}
                value={option.value}
                checked={option.value === this.value}
                disabled={this.disabled || option.disabled}
                // Each radio is labelled by its wrapping label; the group is
                // labelled by the group label above. No id is needed because
                // the wrapping label does the association.
              />
              <span class="sk-radio-group__option-text" data-slot="option-text">
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {/*
          WCAG 1.4.1: a validation message is never conveyed by color alone, so
          the error carries an icon and text, not just a red border.
        */}
        {this.error ? (
          <p class="sk-radio-group__error" data-slot="error" id={this.wiring.errorId}>
            <svg
              class="sk-radio-group__error-icon"
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
            class="sk-radio-group__description"
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
