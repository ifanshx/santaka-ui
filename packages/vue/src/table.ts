import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Table — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The consumer authors the real `<table>` inside the default slot; the adapter
 * never wraps it. No handlers: the element takes no events and owns no state
 * the adapter needs to observe.
 */
export type SkTableElement = HTMLElement & {
  variant: "default" | "plain"
  density: "default" | "compact"
  striped: boolean
  label: string
}

export const Table = defineComponent({
  name: "SkTable",
  props: {
    /** `plain` drops the container chrome for a table inside a card. */
    variant: optionalProp<"default" | "plain">(String),
    /** Zebra rows. */
    striped: optionalProp<boolean>(Boolean),
    /** Cell padding, not a height scale — a table has no intrinsic height. */
    density: optionalProp<"default" | "compact">(String),
    /** The name of the scroll region; with none the viewport carries no role. */
    label: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkTableElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-table",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            striped: props.striped,
            density: props.density,
            label: props.label,
          }),
        },
        slots.default?.(),
      )
  },
})

export type TableProps = {
  variant?: "default" | "plain"
  striped?: boolean
  density?: "default" | "compact"
  label?: string
}
