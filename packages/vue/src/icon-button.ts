import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"
import type { ButtonSize, ButtonType, ButtonVariant } from "./button.js"

/**
 * Icon Button — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * An adapter, not a reimplementation: the accessible-name handling, the 44px
 * target, the ARIA wiring, and the form semantics are owned upstream.
 *
 * `label` is `required: true`, matching the React adapter's required prop. Vue
 * reports a missing required prop in development rather than at compile time,
 * which is weaker than React's type error but is the closest this framework
 * offers; the element itself has no way to invent a name.
 */
export type SkIconButtonElement = HTMLElement & {
  label: string
  variant: ButtonVariant
  size: ButtonSize
  disabled: boolean
  loading: boolean
  type: ButtonType
}

export const IconButton = defineComponent({
  name: "SkIconButton",
  props: {
    /** The accessible name. Required: there is no visible text to fall back on. */
    label: { type: String, required: true },
    /** Visual emphasis. */
    variant: optionalProp<ButtonVariant>(String),
    /** Control height. */
    size: optionalProp<ButtonSize>(String),
    /** Disabled: not submitted, not focusable. Mirrors the ARIA name. */
    disabled: optionalProp<boolean>(Boolean),
    /** Busy: `aria-busy`, and activation is withheld. */
    loading: optionalProp<boolean>(Boolean),
    /** Native button type. `submit` is what makes it participate in a form. */
    type: optionalProp<ButtonType>(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkIconButtonElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-icon-button",
        {
          ref: el,
          ...elementProps({
            label: props.label,
            variant: props.variant,
            size: props.size,
            disabled: props.disabled,
            loading: props.loading,
            type: props.type,
          }),
        },
        slots.default?.(),
      )
  },
})

export type IconButtonProps = {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: ButtonType
}
