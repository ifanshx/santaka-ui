import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Spinner — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * `label` stays optional, matching the element: the honest default ("Loading")
 * is often the right answer, and forcing every call site to write it teaches
 * copy-paste rather than intention.
 *
 * No children: the spinner renders its own ring, and a slot would let a consumer
 * nest content inside a status indicator.
 */
export type SkSpinnerElement = HTMLElement & {
  size: "sm" | "md" | "lg"
  label: string
  status: string
}

export const Spinner = defineComponent({
  name: "SkSpinner",
  props: {
    /** Ring diameter, from the icon-size tokens so it matches the icon beside it. */
    size: optionalProp<"sm" | "md" | "lg">(String),
    /** What the wait is, announced to screen readers. Defaults to "Loading". */
    label: optionalProp<string>(String),
    /** Replaces the label when progress is known, e.g. "Uploading 60%". */
    status: optionalProp<string>(String),
  },
  setup(props, { expose }) {
    const el = ref<SkSpinnerElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-spinner", {
        ref: el,
        ...elementProps({
          size: props.size,
          label: props.label,
          status: props.status,
        }),
      })
  },
})

export type SpinnerProps = {
  size?: "sm" | "md" | "lg"
  label?: string
  status?: string
}
