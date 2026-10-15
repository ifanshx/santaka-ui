import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Checkbox — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The label wraps the control inside the element, so the whole row is the
 * activation target without a click handler; that is the element's business and
 * this adapter adds nothing to it.
 *
 * Two props are deliberately left at the element's own default rather than
 * repeated here:
 *
 *   - `value` — the element already defaults to `"on"`, which is the platform's
 *     default for a checked checkbox, so a plain form reads what a native
 *     checkbox would send. Restating it in the adapter would create a second
 *     source of truth for a value the element owns.
 *   - `checked` / `defaultChecked` — omitted means uncontrolled, and the element
 *     decides. `elementProps` drops `undefined`, which is what keeps the
 *     element's own state rather than overwriting it with a coerced `false`.
 *
 * `indeterminate` is visual state, not form state: an indeterminate checkbox
 * submits as unchecked (`null`), which is what the platform does.
 */
export type CheckboxSize = "sm" | "md" | "lg"
export type CheckboxVariant = "default" | "quiet"

/** The element Stencil generates for `<sk-checkbox>`. */
export type SkCheckboxElement = HTMLElement & {
  variant: CheckboxVariant
  size: CheckboxSize
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  /** The field's name in the form submission. */
  name: string | undefined
  checked: boolean
  defaultChecked: boolean
  indeterminate: boolean
}

export const Checkbox = defineComponent({
  name: "SkCheckbox",
  props: {
    /** Visual emphasis. */
    variant: optionalProp<CheckboxVariant>(String),
    /** Label text size. The row target stays 44px at every size. */
    size: optionalProp<CheckboxSize>(String),
    /** The label text, rendered beside the box. Wraps the control. */
    label: optionalProp<string>(String),
    /** Persistent helper text below the row. */
    description: optionalProp<string>(String),
    /** The validation message. Its presence drives `aria-invalid`. */
    error: optionalProp<string>(String),
    /** Marks the field invalid, with the same independence from `error` as Input. */
    invalid: optionalProp<boolean>(Boolean),
    /** Disables interaction. Mirrors the ARIA name. */
    disabled: optionalProp<boolean>(Boolean),
    /** Native constraint validation still applies and is never suppressed. */
    required: optionalProp<boolean>(Boolean),
    /** Associates the control with a form it is not nested inside. */
    form: optionalProp<string>(String),
    /**
     * The field's name in the form submission.
     *
     * The element reads `name` off its own host attribute — that is how a
     * form-associated element is identified to the platform. Vue writes it as an
     * attribute because `"name" in element` is false, which is what is needed;
     * without it the control renders, validates, and reports its value, and then
     * contributes **nothing** to `FormData`.
     */
    name: optionalProp<string>(String),
    /** Whether the box is checked. An ARIA-mirroring boolean (ADR-013). */
    checked: optionalProp<boolean>(Boolean),
    /** Uncontrolled initial checked state. */
    defaultChecked: optionalProp<boolean>(Boolean),
    /** The value submitted when the box is checked. Defaults to `"on"`. */
    value: optionalProp<string>(String),
    /** Visual "some children" state. Property-only — submits as unchecked. */
    indeterminate: optionalProp<boolean>(Boolean),
    /** Optional HTML id. If omitted, a stable id is generated. */
    id: optionalProp<string>(String),
    /** Called when the user toggles the checkbox. */
    onValueChange: optionalProp<(checked: boolean) => void>(Function),
  },
  emits: ["update:checked"],
  setup(props, { emit, expose }) {
    const el = ref<SkCheckboxElement | null>(null)
    expose(elementProxy(el))

    // The same generated-id rule as Input: section 4 requires an id when the
    // consumer supplies none, and Vue's `useId()` space differs from the
    // element's own counter — which is why an SSR consumer passes an explicit
    // `id` when a separately-rendered `Label` has to find this control.
    const generatedId = useId()

    return () =>
      h("sk-checkbox", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          variant: props.variant,
          size: props.size,
          label: props.label,
          description: props.description,
          error: props.error,
          invalid: props.invalid,
          disabled: props.disabled,
          required: props.required,
          form: props.form,
          name: props.name,
          checked: props.checked,
          defaultChecked: props.defaultChecked,
          value: props.value,
          indeterminate: props.indeterminate,
        }),
        // The event arrives from the custom element host, not the inner input,
        // so the payload is `detail` — the same contract Input and Select adapt.
        onSkValueChange: (event: Event) => {
          const checked = (event as CustomEvent<{ checked: boolean }>).detail.checked
          props.onValueChange?.(checked)
          // Emitted as `update:checked` so `v-model:checked` works. The native
          // `sk-value-change` event stays the single source of truth; this is
          // the Vue spelling of the same fact.
          emit("update:checked", checked)
        },
      })
  },
})

export type CheckboxProps = {
  variant?: CheckboxVariant
  size?: CheckboxSize
  label: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  form?: string
  name?: string
  checked?: boolean
  defaultChecked?: boolean
  value?: string
  indeterminate?: boolean
  id?: string
  onValueChange?: (checked: boolean) => void
}
