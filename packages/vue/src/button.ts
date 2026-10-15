import { defineComponent, h, type PropType, type Slot, type SlotsType } from "vue"
import { elementProps } from "./props.js"

/**
 * Button — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * This is an adapter, not a reimplementation: it renders the same custom element
 * and forwards the same props, so the variant enum, the `data-*` state
 * attributes, the ARIA wiring, and the form semantics are all owned by
 * `@santaka-ui/web-components`.
 *
 * Every convention from section 4 holds here:
 *   - `variant` and `size` are the only visual props.
 *   - `disabled` and `loading` are ARIA names, not `isDisabled`.
 *   - The consumer's `class` merges last so consumer styles win. Vue does this
 *     itself: the component declares no `class` prop, so Vue's attribute
 *     fallthrough merges the consumer's class onto the root element after the
 *     component's own. Declaring it would disable that merge.
 *   - The template ref resolves to the custom element, because the custom
 *     element is the single root node.
 *
 * Props are assigned as element **properties**, not attributes. Vue checks
 * `key in element` and assigns a property when it exists — which it does on an
 * upgraded element, because Stencil defines each `@Prop` as an accessor on the
 * prototype. That is the same path React 19 takes, and it is why the prop types
 * below are the element's own, not attribute strings.
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"
export type ButtonType = "button" | "submit" | "reset"

/** The element Stencil generates for `<sk-button>`. */
export type SkButtonElement = HTMLElement & {
  variant: ButtonVariant
  size: ButtonSize
  disabled: boolean
  loading: boolean
  type: ButtonType
}

export const Button = defineComponent({
  name: "SkButton",
  props: {
    /** Visual emphasis. */
    variant: { type: String as PropType<ButtonVariant>, default: undefined },
    /** Control height. */
    size: { type: String as PropType<ButtonSize>, default: undefined },
    /** Disabled: not submitted, not focusable. Mirrors the ARIA name. */
    disabled: { type: Boolean, default: undefined },
    /** Busy: `aria-busy`, and activation is withheld. */
    loading: { type: Boolean, default: undefined },
    /** Native button type. `submit` is what makes it participate in a form. */
    type: { type: String as PropType<ButtonType>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots }) {
    return () =>
      h(
        "sk-button",
        elementProps({
          variant: props.variant,
          size: props.size,
          disabled: props.disabled,
          loading: props.loading,
          type: props.type,
        }),
        slots.default?.(),
      )
  },
})

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: ButtonType
}
