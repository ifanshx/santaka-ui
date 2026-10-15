import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Text — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Children are rendered verbatim into the light DOM: the element the consumer
 * chose keeps its semantics and the custom element only sets typography on it.
 * There is no `as` prop and deliberately cannot be one — choosing the element is
 * the consumer's document structure.
 */
export type SkTextElement = HTMLElement & {
  variant: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
  family: "inherit" | "sans" | "display" | "mono"
  muted: boolean
}

export type TextVariant =
  "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"

export const Text = defineComponent({
  name: "SkText",
  props: {
    /** The type step, named exactly as the token is. */
    variant: optionalProp<TextVariant>(String),
    /** Which family to set. `inherit` leaves `font-family` alone. */
    family: optionalProp<"inherit" | "sans" | "display" | "mono">(String),
    /** Secondary text color. The one color decision a text component owns. */
    muted: optionalProp<boolean>(Boolean),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkTextElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-text",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            family: props.family,
            muted: props.muted,
          }),
        },
        slots.default?.(),
      )
  },
})

export type TextProps = {
  variant?: TextVariant
  family?: "inherit" | "sans" | "display" | "mono"
  muted?: boolean
}
