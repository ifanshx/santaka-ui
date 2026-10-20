import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Kbd — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Thin by construction: one size prop and a default slot, because the element
 * owns the `<kbd>` and everything the component contributes. There is no way to
 * swap that element from here — the real `<kbd>` is the component's entire
 * reason for existing.
 */
export type SkKbdElement = HTMLElement & {
  size: "sm" | "md"
}

export type KbdSize = "sm" | "md"

export const Kbd = defineComponent({
  name: "SkKbd",
  props: {
    /** The type step the shortcut is set in. */
    size: optionalProp<KbdSize>(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkKbdElement | null>(null)
    expose(elementProxy(el))
    return () => h("sk-kbd", { ref: el, ...elementProps({ size: props.size }) }, slots.default?.())
  },
})

export type KbdProps = {
  size?: KbdSize
}
