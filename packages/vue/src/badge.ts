import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Badge — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A badge is a static label, so this adapter is thin by construction: props onto
 * the custom element, children into its slot.
 *
 * **A divergence worth naming.** The React adapter requires `statusLabel` when
 * `dot` is set, as a type-level union, so `<Badge dot />` with no accessible
 * name is a compile error. Vue's `defineComponent` cannot overload its props
 * declaration, so the same mistake compiles here. The rule is documented in
 * `BadgeProps` below and in the element's own docs, and the element renders the
 * dot without a name if it is broken — the one place in this package where a
 * requirement is stated rather than enforced.
 */
export type SkBadgeElement = HTMLElement & {
  variant: "neutral" | "primary" | "success" | "warning" | "danger"
  size: "sm" | "md"
  dot: boolean
  statusLabel: string
}

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger"
export type BadgeSize = "sm" | "md"

export const Badge = defineComponent({
  name: "SkBadge",
  props: {
    /** Visual emphasis. `neutral` is the element's own default. */
    variant: optionalProp<BadgeVariant>(String),
    /** Control height. */
    size: optionalProp<BadgeSize>(String),
    /** Renders the badge as a dot instead of a pill. Requires `statusLabel`. */
    dot: optionalProp<boolean>(Boolean),
    /**
     * Screen-reader text for the dot variant. Required whenever `dot` is set:
     * a dot conveys state by color alone, which WCAG 1.4.1 forbids.
     */
    statusLabel: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkBadgeElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-badge",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            size: props.size,
            dot: props.dot,
            statusLabel: props.statusLabel,
          }),
        },
        slots.default?.(),
      )
  },
})

export type BadgeProps = {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  statusLabel?: string
}

/** The dot variant and its label are required together, as a type. */
export type DotBadgeProps = BadgeProps & { dot: true; statusLabel: string }
