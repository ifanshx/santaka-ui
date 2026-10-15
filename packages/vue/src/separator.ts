import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Separator — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * No slot, matching the component: a separator has no content. The `<hr>` is the
 * element.
 */
export type SkSeparatorElement = HTMLElement & {
  orientation: "horizontal" | "vertical"
  decorative: boolean
  label: string
}

export const Separator = defineComponent({
  name: "SkSeparator",
  props: {
    /** Axis of the line. Vertical separators need a sized parent. */
    orientation: optionalProp<"horizontal" | "vertical">(String),
    /** Purely visual: removes the element from the accessibility tree. */
    decorative: optionalProp<boolean>(Boolean),
    /** Label for a meaningful separator, e.g. "or" between two actions. */
    label: optionalProp<string>(String),
  },
  setup(props, { expose }) {
    const el = ref<SkSeparatorElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-separator", {
        ref: el,
        ...elementProps({
          orientation: props.orientation,
          decorative: props.decorative,
          label: props.label,
        }),
      })
  },
})

export type SeparatorProps = {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
  label?: string
}
