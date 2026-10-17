import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Progress — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * No slot: the element renders its own track and bar, and a slotted child would
 * land inside a status indicator. No handlers: a progress bar takes no events.
 */
export type SkProgressElement = HTMLElement & {
  value?: number
  max: number
  label: string
  size: "sm" | "md" | "lg"
}

export const Progress = defineComponent({
  name: "SkProgress",
  props: {
    /** The current value; omit (or pass a non-finite) for the indeterminate sweep. */
    value: optionalProp<number>(Number),
    /** The scale the value is measured against. */
    max: optionalProp<number>(Number),
    /** The accessible name, used only when the host carries no labelling of its own. */
    label: optionalProp<string>(String),
    /** Track height scale. */
    size: optionalProp<"sm" | "md" | "lg">(String),
  },
  setup(props, { expose }) {
    const el = ref<SkProgressElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-progress", {
        ref: el,
        ...elementProps({
          value: props.value,
          max: props.max,
          label: props.label,
          size: props.size,
        }),
      })
  },
})

export type ProgressProps = {
  value?: number
  max?: number
  label?: string
  size?: "sm" | "md" | "lg"
}
