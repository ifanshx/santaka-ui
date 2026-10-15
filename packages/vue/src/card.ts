import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Card — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Slotting needs no handling here, for the same reason it needs none in React:
 * the browser performs light-DOM slot assignment, so `<div slot="header">`
 * authored in a Vue template arrives as a child of the host with its `slot`
 * attribute intact. Measured in `probe.test.ts` before this file was written:
 * `<div slot="header">H</div><p>body</p>` survives `h()` verbatim.
 *
 * Note the difference from the React adapter's `className`: Vue merges the
 * consumer's `class` through attribute fallthrough, so this component declares
 * no `class` prop. Declaring one would disable the merge.
 */
export type SkCardElement = HTMLElement & {
  variant: "default" | "outlined" | "bare"
  padding: "none" | "sm" | "md" | "lg"
  heading: string
  subtitle: string
}

export const Card = defineComponent({
  name: "SkCard",
  props: {
    /** Visual emphasis. `outlined` drops the fill; `bare` drops fill and shadow. */
    variant: optionalProp<"default" | "outlined" | "bare">(String),
    /** Inner padding. Not `size`: a card has no intrinsic height to scale. */
    padding: optionalProp<"none" | "sm" | "md" | "lg">(String),
    /**
     * Heading text, rendered in the header slot's fallback. Pass it only for
     * plain text; use `<h2 slot="header">` when the heading is a real heading.
     */
    heading: optionalProp<string>(String),
    /** Supporting text under the heading. */
    subtitle: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkCardElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-card",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            padding: props.padding,
            heading: props.heading,
            subtitle: props.subtitle,
          }),
        },
        slots.default?.(),
      )
  },
})

export type CardProps = {
  variant?: "default" | "outlined" | "bare"
  padding?: "none" | "sm" | "md" | "lg"
  heading?: string
  subtitle?: string
}
