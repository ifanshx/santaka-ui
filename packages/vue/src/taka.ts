import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Taka — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. The mascot is drawn as SVG paths in
 * `packages/web-components/src/components/sk-taka/`, original rather than traced
 * or borrowed, which is what section 13 requires of the artwork.
 *
 * Decorative by default: the element carries no role and is not a focus stop, so a
 * consumer who wants it announced supplies `aria-label` and `role="img"` — the
 * adapter deliberately does not invent an accessible name for a mascot.
 */
export type SkTakaElement = HTMLElement & {
  mood: "idle" | "wave" | "bounce"
  size: "sm" | "md" | "lg"
}

export const Taka = defineComponent({
  name: "SkTaka",
  props: {
    mood: optionalProp<"idle" | "wave" | "bounce">(String),
    size: optionalProp<"sm" | "md" | "lg">(String),
  },
  setup(props, { expose }) {
    const el = ref<SkTakaElement | null>(null)
    expose(elementProxy(el))
    return () => h("sk-taka", { ref: el, ...elementProps({ mood: props.mood, size: props.size }) })
  },
})

export type TakaProps = {
  mood?: "idle" | "wave" | "bounce"
  size?: "sm" | "md" | "lg"
}
