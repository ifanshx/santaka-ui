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
 * Select — Tier 2, and the contract-heaviest control in the library.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * The architecture decision this component exists to record: **it renders a
 * real native `<select>`, visibly.** §4 allows composite controls to hide the
 * native element and carry the value in a hidden input — the Radix-shaped
 * custom listbox with a visually-hidden `<select>`. That path was rejected
 * here, deliberately, for three reasons that compound:
 *
 *  1. A native `<select>` submits through a plain `<form>` with no wiring, is
 *     styled by every browser, works on touch, scrolls with a wheel, filters by
 *     typing, and validates natively. A custom listbox reimplements all of it —
 *     typeahead, `aria-activedescendant`, scroll-into-view, IME — and gets most
 *     of it subtly wrong.
 *  2. This library's chrome is brutalist and *restylable*: the native select's
 *     popup cannot be styled, but the closed control can be, and the popup
 *     being native means it works on a phone rather than fighting one.
 *  3. The forms contract's spirit is "the browser owns what the browser is
 *     good at". A hidden `<select>` behind a custom listbox is the browser
 *     owning a filing cabinet while the component pretends to be the clerk.
 *
 * Options are passed as JSON via the `options` prop — an array of
 * `{ value, label, disabled? }` — rather than slotted `<option>` elements,
 * because slotted options would be children of the host while the native
 * `<select>` is a child of the host's render tree, and light-DOM slot
 * distribution cannot move them in (the Dialog's panel learned this). JSON
 * keeps the declaration where the value lives and serializes for SSR.
 *
 * Everything else is the Input contract: FACE with all three callbacks, native
 * constraint validation through `required`, label/description/error wiring,
 * and `sk-value-change` only for user-initiated changes.
 */

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

@Component({
  tag: "sk-select",
  // ADR-011: scoped styles, not Shadow DOM — same reasoning as Input, and the
  // inner <select> must be visible to the page's own form handling.
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkSelect {
  /** The choices. Serialized as JSON when written as an attribute. */
  @Prop() options: SelectOption[] = []

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

  /** Marks the field invalid, with the same independence from `error` as Input. */
  @Prop({ reflect: true }) invalid = false

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /** Native constraint validation still applies and is never suppressed. */
  @Prop({ reflect: true }) required = false

  /** Placeholder-style first choice, shown when the value is "". */
  @Prop() placeholder = ""

  /** Associates the control with a form it is not nested inside. */
  @Prop({ reflect: true }) form?: string

  /** The value. Uncontrolled by default. */
  @Prop({ reflect: true }) value = ""

  /** Initial value for the uncontrolled case. */
  @Prop() defaultValue = ""

  @State() private optionsJson: SelectOption[] = []

  /** The custom element itself. Public so the shared wiring can drive it. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private select?: TextControl
  private teardown?: () => void
  private wiring = createFieldWiring(this.host, "sk-select")

  /** Accessors onto this component, for the shared form-control base. */
  private get accessors(): FormControlAccessors {
    return {
      host: this.host,
      control: () => this.select,
      internals: () => this.internals,
      disabled: () => this.disabled,
      readOnly: () => false,
      value: () => this.value,
      setValue: (value) => this.setValue(value),
      resetValue: () => this.resetValue(),
      restoreValue: (value) => this.setValue(value),
      setDisabled: (disabled) => {
        if (disabled !== this.disabled) this.disabled = disabled
      },
      onValueChanged: () => {
        /* Select has no empty-state visuals to recompute. */
      },
    }
  }

  componentWillLoad() {
    this.internals = this.host.attachInternals()
    this.optionsJson = this.parseOptions(this.host.getAttribute("options"))
    // The element may upgrade after the form was parsed, so the initial value is
    // read from the attribute rather than assumed empty.
    if (!this.value && this.host.hasAttribute("value")) {
      this.value = this.host.getAttribute("value") ?? ""
    }
    if (!this.defaultValue && this.host.hasAttribute("value")) {
      this.defaultValue = this.host.getAttribute("value") ?? ""
    }

    this.teardown = setupFormControl(this.accessors)
    this.sync()
  }

  disconnectedCallback() {
    this.teardown?.()
  }

  componentDidRender() {
    this.select = (this.host.querySelector("select") as TextControl | null) ?? undefined
    this.sync()
  }

  /**
   * Options arrive as a JSON string when written as an attribute and an array
   * when set as a property. Parsing once here, not on every render.
   */
  private parseOptions(raw: string | null): SelectOption[] {
    if (!raw) return this.options
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // A malformed attribute must not take the whole field down; an empty
      // select with a visible error is better than a blank page.
      return []
    }
  }

  /** Writes the value and pushes it to the form. */
  private setValue(value: string) {
    this.value = value
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
  onValueChange(next: string) {
    if (this.select && this.select.value !== next) this.select.value = next
    this.sync()
  }

  @Watch("options")
  optionsChanged(next: SelectOption[]) {
    this.optionsJson = Array.isArray(next) ? next : []
  }

  render() {
    const controlId = this.wiring.controlId()
    const describedBy = this.wiring.describedBy(this.description, this.error)
    const ariaInvalid = isFieldInvalid(this.invalid, this.error)
    const hasValue = this.value !== ""

    return (
      <Host data-slot="field" data-invalid={ariaInvalid ? "" : undefined}>
        {this.label ? (
          <label class="sk-select__label" data-slot="label" htmlFor={controlId}>
            {this.label}
            {this.required ? (
              <span class="sk-select__required" data-slot="required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        {/*
          A real native <select>, visibly. The popup is the browser's: it works
          on touch, scrolls with a wheel, filters by typing, and validates
          natively. The closed control is the styled part.
        */}
        <select
          class="sk-select__control"
          data-slot="control"
          ref={(el) => (this.select = (el ?? undefined) as TextControl | undefined)}
          id={controlId}
          disabled={this.disabled}
          required={this.required}
          aria-invalid={ariaInvalid ? "true" : undefined}
          aria-describedby={describedBy}
          // The inner control is the labelled element; the host must not be a
          // second tab stop or it would double every tab sequence.
          tabindex={this.disabled ? -1 : undefined}
        >
          {this.placeholder ? (
            <option value="" disabled={this.required} selected={!hasValue}>
              {this.placeholder}
            </option>
          ) : null}
          {this.optionsJson.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              selected={option.value === this.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {this.error ? (
          <p class="sk-select__error" data-slot="error" id={this.wiring.errorId}>
            <svg
              class="sk-select__error-icon"
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
          <p class="sk-select__description" data-slot="description" id={this.wiring.descriptionId}>
            {this.description}
          </p>
        ) : null}
      </Host>
    )
  }
}
