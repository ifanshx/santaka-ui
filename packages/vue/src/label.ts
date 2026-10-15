import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Label — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The prop is `htmlFor`, the spelling every framework's ecosystem uses, and the
 * adapter maps it onto the element's `for` attribute — the one spelling that
 * exists in plain HTML. Vue passes `for` as an attribute rather than a property
 * (`"for" in element` is false on a custom element that is not a `<label>`), so
 * the mapping is a one-line alias and needs no `cn`-style helper.
 */
export type SkLabelElement = HTMLElement & {
  forId: string
  required: boolean
  marker: "after" | "before"
}

export const Label = defineComponent({
  name: "SkLabel",
  props: {
    /**
     * The id of the control this label names. Note that field components render
     * their control with the id `${hostId}-control`, so `for` must carry that
     * suffix.
     */
    htmlFor: { type: String, required: true },
    /** Renders the required marker. The control's own `required` carries the semantics. */
    required: optionalProp<boolean>(Boolean),
    /** Where the marker sits. `before` when the control leads the sentence. */
    marker: optionalProp<"after" | "before">(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkLabelElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-label",
        {
          ref: el,
          ...elementProps({
            // The element's attribute is `for`; the adapter's prop is `htmlFor`.
            for: props.htmlFor,
            required: props.required,
            marker: props.marker,
          }),
        },
        slots.default?.(),
      )
  },
})

export type LabelProps = {
  htmlFor: string
  required?: boolean
  marker?: "after" | "before"
}
