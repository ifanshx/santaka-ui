import { nextId } from "@santaka-ui/utilities"

/**
 * Shared behavior for form-associated text controls.
 *
 * `sk-input` and `sk-textarea` are the same control with a different rendered
 * element. Their form participation, validation reporting, label wiring,
 * accessibility semantics, and change-event rules are identical, so they live
 * here once.
 *
 * This exists because the first pass had all of it inline in `sk-input`, and
 * writing `sk-textarea` meant facing a real decision: copy 150 lines and accept
 * two things to fix whenever accessibility behavior changes, or extract it. Plan
 * §4 risk R4 names exactly this: "Never pay the full component Definition of
 * Done twice for the same interaction model."
 *
 * The base reads and writes the component through **accessors** rather than a
 * state object. An object of plain values looks simpler but is a snapshot: the
 * base would write `state.value` on a copy, the component would never see it,
 * and the field would silently stop submitting. That is not hypothetical — it
 * is what the first attempt at this extraction did.
 *
 * This is a mixin target, not a component: it holds no render state and
 * registers nothing.
 */

/** The rendered control this base drives. `<textarea>` is a sibling of `<input>`. */
export type TextControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/**
 * Accessors onto the component that owns the state.
 *
 * Every field is a getter rather than a value, so the base always reads the
 * component's current state and a write through `setValue` always reaches it.
 */
export type FormControlAccessors = {
  host: HTMLElement
  /** The rendered control, or `undefined` before the first render. */
  control: () => TextControl | undefined
  internals: () => ElementInternals | undefined
  disabled: () => boolean
  readOnly: () => boolean
  value: () => string
  /** Writes the component's `value`. */
  setValue: (value: string) => void
  /** Resets to the component's initial value, for `formResetCallback`. */
  resetValue: () => void
  /** Restores a state the browser handed back, for autofill and bfcache. */
  restoreValue: (value: string) => void
  /** Reflects a disabled ancestor fieldset, for `formDisabledCallback`. */
  setDisabled: (disabled: boolean) => void
  /** Called whenever the control's value changes, so the component can re-render. */
  onValueChanged: (value: string) => void
}

/** The ids and derived accessibility attributes a form control owns. */
export type FieldWiring = {
  /** Id for the description element. */
  descriptionId: string
  /** Id for the error element. */
  errorId: string
  /** Id for the control, derived from the host's own id when one is given. */
  controlId: () => string
  /** Ids to hand to `aria-describedby`, or undefined when there are none. */
  describedBy: (description: string, error: string) => string | undefined
}

/**
 * Build the id and `aria-describedby` wiring for a form control.
 *
 * When the consumer supplies an id on the host, the *control* gets a derived
 * one rather than the host reusing it verbatim: giving the host and its inner
 * control the same id would make `document.getElementById` ambiguous, and a
 * `<label for>` pointing at that id would resolve to whichever element came
 * first — the host — so clicking the label would focus nothing.
 */
export function createFieldWiring(host: HTMLElement, prefix: string): FieldWiring {
  const descriptionId = nextId("sk-description")
  const errorId = nextId("sk-error")
  const generatedId = nextId(prefix)

  return {
    descriptionId,
    errorId,
    controlId: () => {
      const hostId = host.getAttribute("id")
      return hostId ? `${hostId}-control` : generatedId
    },
    describedBy: (description, error) => {
      const ids: string[] = []
      if (description && !error) ids.push(descriptionId)
      if (error) ids.push(errorId)
      return ids.length > 0 ? ids.join(" ") : undefined
    },
  }
}

/**
 * Set up the input/change listeners and the change-event rule for a control.
 *
 * Section 4 requires that a change event fires only for user-initiated changes.
 * A flag set around a programmatic write is the obvious way to do that, and it
 * is wrong: the write and the user's next keystroke can land in the same tick, and
 * the flag then suppresses a genuine edit. Comparing against the last reported
 * value states the rule directly — an event means "the value you last saw has
 * changed" — and carries no timing dependency.
 */
export function setupFormControl(accessors: FormControlAccessors) {
  let reportedValue: string | undefined

  const readValue = (event: Event) => (event.target as TextControl | null)?.value ?? ""

  const onInput = (event: Event) => {
    const value = readValue(event)
    accessors.setValue(value)
    accessors.onValueChanged(value)
  }

  const onChange = (event: Event) => {
    const value = readValue(event)
    accessors.setValue(value)
    accessors.onValueChanged(value)

    // A programmatic `value` assignment never dispatches these events, so
    // anything arriving here came from the control itself.
    if (reportedValue === value) return
    reportedValue = value

    accessors.host.dispatchEvent(
      new CustomEvent("sk-value-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  // Delegated rather than bound to the control, because the control is
  // re-rendered and a listener bound to the old node would be lost.
  accessors.host.addEventListener("input", onInput)
  accessors.host.addEventListener("change", onChange)

  return () => {
    accessors.host.removeEventListener("input", onInput)
    accessors.host.removeEventListener("change", onChange)
  }
}

/**
 * Push the value and the control's validity to the form.
 *
 * Both halves are contract requirements. A disabled control must not submit,
 * because a field that submits after being disabled corrupts the submission;
 * and validity has to reach `setValidity` with an anchor so the browser places
 * the error bubble on the field itself.
 */
export function syncFormControl(accessors: FormControlAccessors) {
  const internals = accessors.internals()
  if (!internals) return

  internals.setFormValue(accessors.disabled() ? null : accessors.value())

  if (accessors.readOnly()) {
    // Read-only is not a constraint violation; the field is simply not editable,
    // so reporting it invalid would be wrong.
    internals.setValidity({})
    return
  }

  const control = accessors.control()
  if (!control) {
    internals.setValidity({})
    return
  }

  // `validationMessage` lives on the control, not on `ValidityState`; the state
  // object only carries the flags. The browser's own message is passed through so
  // the error bubble is in the user's language rather than a hard-coded string.
  if (control.validity.valid) {
    internals.setValidity({})
  } else {
    internals.setValidity(control.validity, control.validationMessage, control)
  }
}

/**
 * A field is invalid from either signal: the consumer marking it invalid before
 * it knows why, or an error message being present at all.
 */
export function isFieldInvalid(invalid: boolean, error: string): boolean {
  return invalid || error !== ""
}
