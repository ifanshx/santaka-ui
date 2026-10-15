import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Skeleton — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * No slot, matching the component: a skeleton's children are always nothing, and
 * a template that accepted them would let a consumer nest content inside the
 * scaffolding it exists to replace.
 */
export type SkSkeletonElement = HTMLElement & {
  variant: "text" | "rect" | "circle"
  direction: "ltr" | "rtl"
}

export const Skeleton = defineComponent({
  name: "SkSkeleton",
  props: {
    /** The shape being promised. `text` tracks the body line height by default. */
    variant: optionalProp<"text" | "rect" | "circle">(String),
    /** Shimmer direction. Set it for a right-to-left reading context. */
    direction: optionalProp<"ltr" | "rtl">(String),
  },
  setup(props, { expose }) {
    const el = ref<SkSkeletonElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-skeleton", {
        ref: el,
        ...elementProps({ variant: props.variant, direction: props.direction }),
      })
  },
})

export type SkeletonProps = {
  variant?: "text" | "rect" | "circle"
  direction?: "ltr" | "rtl"
}
