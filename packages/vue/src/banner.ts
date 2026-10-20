import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Banner — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * **A divergence worth naming.** The React adapter requires `aria-label` or
 * `aria-labelledby` as a type-level union, so an unnamed banner — which is not
 * exposed as a landmark at all — is a compile error. Vue's `defineComponent`
 * cannot overload its props declaration, so the same mistake compiles here. It
 * is documented in `BannerProps` and in the element's own docs, and this is the
 * second place in this package where a requirement is stated rather than
 * enforced (the first is `Badge`'s `dot`/`statusLabel` pair).
 */
export type SkBannerElement = HTMLElement & {
  variant: "neutral" | "primary" | "success" | "warning" | "danger"
  heading: string
  fullWidth: boolean
}

export type BannerVariant = "neutral" | "primary" | "success" | "warning" | "danger"

export const Banner = defineComponent({
  name: "SkBanner",
  props: {
    /** Visual emphasis. */
    variant: optionalProp<BannerVariant>(String),
    /** Heading text. Not `title`: that is a standardized `HTMLElement` member. */
    heading: optionalProp<string>(String),
    /**
     * Spans the container as a full-width strip. `false` keeps it in the flow,
     * for a message about one section.
     */
    fullWidth: optionalProp<boolean>(Boolean),
  },
  slots: Object as SlotsType<{ default?: Slot; actions?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkBannerElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-banner",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            heading: props.heading,
            fullWidth: props.fullWidth,
          }),
        },
        {
          default: () => slots.default?.(),
          actions: () => slots.actions?.(),
        },
      )
  },
})

export type BannerProps = {
  variant?: BannerVariant
  heading?: string
  fullWidth?: boolean
}
