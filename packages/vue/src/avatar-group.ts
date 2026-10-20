import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * AvatarGroup — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Thin by construction: `max`, `label`, and `size` onto the custom element, and
 * the avatars through the default slot. `label` is what makes the group a
 * landmark — an unnamed `role="group"` is skipped by most screen readers — so
 * the element renders no role at all without one.
 */
export type SkAvatarGroupElement = HTMLElement & {
  max: number
  label: string
  size: "sm" | "md" | "lg"
}

export const AvatarGroup = defineComponent({
  name: "SkAvatarGroup",
  props: {
    /** How many to show before collapsing the rest into a count. `0` shows all. */
    max: optionalProp<number>(Number),
    /** The accessible name for the group — "Assigned to", "Contributors". */
    label: optionalProp<string>(String),
    /** Diameter applied to every avatar in the group. */
    size: optionalProp<"sm" | "md" | "lg">(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkAvatarGroupElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-avatar-group",
        {
          ref: el,
          ...elementProps({ max: props.max, label: props.label, size: props.size }),
        },
        slots.default?.(),
      )
  },
})

export type AvatarGroupProps = {
  max?: number
  label?: string
  size?: "sm" | "md" | "lg"
}
