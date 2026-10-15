import { defineComponent, h, ref, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Tooltip — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The compound parts follow the Dialog convention: `Tooltip` and
 * `TooltipTrigger` over slot attributes. The trigger must be a focusable element
 * — a non-interactive span gives keyboard users nothing to describe.
 *
 * The trigger content is authored by the consumer, so `TooltipTrigger` forwards
 * the default slot into the `slot="trigger"` span rather than wrapping a fixed
 * control. That keeps the adapter from deciding what is focusable.
 */
export type SkTooltipElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "left" | "right"
  delay: number
}

export const TooltipTrigger = defineComponent({
  name: "SkTooltipTrigger",
  setup(_props, { slots }) {
    return () => h("span", { slot: "trigger" }, slots.default?.())
  },
})

export type TooltipTriggerProps = {
  /** The trigger content. Must be focusable. */
  default?: () => VNode[]
}

export const Tooltip = defineComponent({
  name: "SkTooltip",
  props: {
    open: optionalProp<boolean>(Boolean),
    /** Preferred side. Flips at the viewport edge rather than clipping. */
    placement: optionalProp<"top" | "bottom" | "left" | "right">(String),
    /** Milliseconds of hover before showing. A tooltip that fires instantly is a strobe. */
    delay: optionalProp<number>(Number),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, expose }) {
    const el = ref<SkTooltipElement | null>(null)
    expose(elementProxy(el))

    return () =>
      h(
        "sk-tooltip",
        {
          ref: el,
          ...elementProps({
            open: props.open,
            placement: props.placement,
            delay: props.delay,
          }),
        },
        slots.default?.(),
      )
  },
})

export type TooltipProps = {
  open?: boolean
  placement?: "top" | "bottom" | "left" | "right"
  delay?: number
  default?: () => VNode[]
}
