import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Alert — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Props onto the custom element, children into its default slot, `actions`
 * children forwarded by the browser's own slot assignment. No handlers: the
 * element takes no events and owns no state the adapter needs to observe.
 */
export type SkAlertElement = HTMLElement & {
  variant: "neutral" | "primary" | "success" | "warning" | "danger"
  heading: string
}

export const Alert = defineComponent({
  name: "SkAlert",
  props: {
    /** Visual emphasis; also picks the default live-region role. */
    variant: optionalProp<"neutral" | "primary" | "success" | "warning" | "danger">(String),
    /** Heading text, rendered as a `<span>` — a real heading belongs in the body. */
    heading: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: Slot; actions?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkAlertElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-alert",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            heading: props.heading,
          }),
        },
        slots.default?.(),
      )
  },
})

export type AlertProps = {
  variant?: "neutral" | "primary" | "success" | "warning" | "danger"
  heading?: string
}
