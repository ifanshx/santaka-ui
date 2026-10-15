import { Component, Element, h, Host, Prop, Watch } from "@stencil/core"
import { createFieldWiring, isFieldInvalid, type FieldWiring } from "../shared/form-control-base.js"

/**
 * Checkbox — Tier 2, the first of the three missing forms controls.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * This is the Input contract on a boolean: FACE with all three callbacks,
 * native constraint validation through `required`, label/description/error
 * wiring, and `sk-value-change` only for user-initiated changes.
 *
 * The shared text base (`setupFormControl`/`syncFormControl`) is deliberately
 * NOT reused wholesale. It speaks strings: it reads `event.target.value` and
 * writes `setFormValue(value)` verbatim. A checkbox speaks a boolean — the
 * native `change` event carries the same `value` attribute whether the box was
 * just checked or unchecked, and `setFormValue("")` would submit an empty pair
 * where the platform withholds the entry entirely. Translating at the accessor
 * boundary was the first attempt, and it got unchecking wrong: every toggle
 * read back as checked. So this component owns the boolean path and reuses
 * only the stateless pieces — `createFieldWiring` and `isFieldInvalid` — plus
 * the validity half of `syncFormControl` through a string view the base never
 * submits.
 *
 * The rendered control is a real native `<input type="checkbox">`, visually
 * restyled but never removed. `appearance: none` clears the native box so the
 * brutalist one draws instead, while the input stays in the tab order, keeps
 * the platform's Space-to-toggle behavior, and remains the labelled element
 * the form and assistive technology see.
 *
 * The label wraps the input rather than pointing at it with `for`. For a
 * checkbox the lead sentence is the control itself — Label's `marker="before"`
 * exists for exactly this shape — and a wrapping label makes the whole row
 * the activation target with no click handler, because the browser's own label
 * activation toggles it.
 *
 * `indeterminate` is visual state, not form state: the property-only flag the
 * platform exposes for "some but not all children", written to the DOM node
 * after each render because it is not an attribute and cannot be declared in
 * JSX. An indeterminate checkbox submits as unchecked (`null`), which is what
 * the platform does — a half-answer is not an answer.
 */
@Component({
  tag: "sk-checkbox",
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkCheckbox {
  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: "default" | "quiet" = "default"

  /** Label text size. The row target stays 44px at every size. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /** The label text, rendered beside the box. Wraps the control. */
  @Prop() label = ""

  /** Persistent helper text below the row. */
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

  /**
   * Whether the box is checked. An ARIA-mirroring boolean, so the ARIA name
   * verbatim (ADR-013, decision 1) — not `isChecked`, not `value`.
   */
  @Prop({ reflect: true, mutable: true }) checked = false

  /** Initial state for the uncontrolled case. */
  @Prop({ attribute: "default-checked" }) defaultChecked = false

  /**
   * The submitted value when checked. `"on"` is the platform default, kept so
   * a plain form reads exactly what a native checkbox would send.
   */
  @Prop({ reflect: true }) value = "on"

  /**
   * Visual "some children" state. Property-only on the platform — there is no
   * `indeterminate` attribute — so this prop writes the DOM node after render
   * and never reaches the form: an indeterminate box submits as unchecked.
   */
  @Prop() indeterminate = false

  /** The custom element itself. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private input?: HTMLInputElement
  private wiring!: FieldWiring

  /**
   * The last reported state, for the change-event rule (section 4): an event
   * means "the state you last saw has changed". A programmatic write never
   * dispatches a native event, so anything arriving through the listener came
   * from the user — but the guard stays, because it states the rule without a
   * timing dependency, the same way the text base does.
   */
  private reportedChecked: boolean | undefined

  componentWillLoad() {
    // Assigned here, not as a field initializer: a field initializer runs in the
    // constructor, before Stencil assigns `this.host`.
    this.wiring = createFieldWiring(this.host, "sk-checkbox")
    this.internals = this.host.attachInternals()
    // The element may upgrade after the form was parsed, so the initial state
    // is read from the attribute rather than assumed unchecked.
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

    // Delegated rather than bound to the control, because the control is
    // re-rendered and a listener bound to the old node would be lost — the
    // same reason the text base delegates.
    this.host.addEventListener("change", this.onNativeChange)
    this.sync()
  }

  disconnectedCallback() {
    this.host.removeEventListener("change", this.onNativeChange)
  }

  componentDidRender() {
    this.input =
      (this.host.querySelector("input[type='checkbox']") as HTMLInputElement | null) ?? undefined
    // `indeterminate` is not an attribute and cannot be declared — it is
    // written to the node after every render, or a re-render clears it.
    if (this.input && this.input.indeterminate !== this.indeterminate) {
      this.input.indeterminate = this.indeterminate
    }
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
    // Checking clears the visual half-state: a box cannot be both an answer
    // and a half-answer, and the platform clears it the same way.
    if (checked) this.indeterminate = false
    this.checked = checked
    this.sync()
  }

  private readOnly = () => false

  private resetValue() {
    this.indeterminate = false
    this.reportedChecked = this.defaultChecked
    this.setChecked(this.defaultChecked)
  }

  private sync() {
    const internals = this.internals
    if (!internals) return
    // An unchecked box withholds the pair entirely — `setFormValue(null)`
    // means "not successful", the same rule a native checkbox follows, where
    // an unchecked box contributes no entry at all. `setFormValue("")` would
    // submit an empty pair, which is a different (and wrong) submission.
    if (!this.disabled && this.checked) {
      internals.setFormValue(this.value)
    } else {
      internals.setFormValue(null)
    }
    // Validity: required on an unchecked box is a constraint violation the
    // browser reports itself. Copied from the text base's validity logic,
    // without the string `setFormValue` call.
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
   * Restores autofill and bfcache values. The contract requires this.
   * The platform restores `"on"` for a checked box and `null` for unchecked.
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
   * is the only event path, and a prop write dispatches no native event, so
   * there is nothing to suppress here — only the form and the node to update.
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
        data-checked={this.checked || this.indeterminate ? "true" : "false"}
      >
        {/*
          The label wraps the input: for a checkbox the control leads the
          sentence, and wrapping makes the whole row the activation target with
          no click handler — the browser's own label activation toggles it.
          `aria-checked` carries the tri-state (`mixed`); the native input
          keeps no `aria-checked` of its own because its role already exposes
          the state and a second source would diverge.
        */}
        <label class="sk-checkbox__label" data-slot="label" htmlFor={controlId}>
          <input
            class="sk-checkbox__control"
            data-slot="control"
            ref={(el) => (this.input = (el ?? undefined) as HTMLInputElement | undefined)}
            id={controlId}
            type="checkbox"
            checked={this.checked}
            value={this.value}
            disabled={this.disabled}
            required={this.required}
            aria-invalid={ariaInvalid ? "true" : undefined}
            aria-describedby={describedBy}
          />
          <span data-checked={this.indeterminate ? "mixed" : this.checked ? "true" : "false"}>
            {this.label}
            {this.required ? (
              <span class="sk-checkbox__required" data-slot="required" aria-hidden="true">
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
          <p class="sk-checkbox__error" data-slot="error" id={this.wiring.errorId}>
            <svg
              class="sk-checkbox__error-icon"
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
            class="sk-checkbox__description"
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
