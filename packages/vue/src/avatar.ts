import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Avatar — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Thin by construction: `name`, `src`, and `size` onto the custom element. The
 * element derives the initials from `name`, so there is no `initials` prop here
 * either — two fields that can disagree are how an avatar shows "JD" while
 * announcing "Jane Doe".
 */
export type SkAvatarElement = HTMLElement & {
  name: string
  src: string
  size: "sm" | "md" | "lg"
}

export type AvatarSize = "sm" | "md" | "lg"

export const Avatar = defineComponent({
  name: "SkAvatar",
  props: {
    /**
     * The person's name — the accessible name of the image and the source of
     * the initials.
     */
    name: optionalProp<string>(String),
    /** Image source. Without it, the initials render. */
    src: optionalProp<string>(String),
    /** Diameter. */
    size: optionalProp<AvatarSize>(String),
  },
  setup(props, { expose }) {
    const el = ref<SkAvatarElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-avatar", {
        ref: el,
        ...elementProps({ name: props.name, src: props.src, size: props.size }),
      })
  },
})

export type AvatarProps = {
  name: string
  src?: string
  size?: AvatarSize
}
