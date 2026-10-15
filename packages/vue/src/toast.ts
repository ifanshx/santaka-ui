import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Toast — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A toast is announced when it appears and must not steal focus, so the adapter
 * renders no focusable wrapper: the message goes in the default slot, and the
 * close button lives inside the component.
 *
 * `onDismiss` is wired to `sk-open-change` and fires only on the close edge. The
 * element reports both edges through one event, so the adapter filters — a
 * consumer's `onDismiss` should not run when the toast opens.
 */
export type SkToastElement = HTMLElement & {
  open: boolean
  duration: number
  variant: "neutral" | "success" | "warning" | "danger"
}

export const Toast = defineComponent({
  name: "SkToast",
  props: {
    open: optionalProp<boolean>(Boolean),
    /** Milliseconds before auto-dismiss. `0` never expires. */
    duration: optionalProp<number>(Number),
    /** Severity, drawn as a 3px left edge plus the message text. */
    variant: optionalProp<"neutral" | "success" | "warning" | "danger">(String),
    /** Fires on dismiss, whether by clock, button, or consumer. */
    onDismiss: optionalProp<() => void>(Function),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkToastElement | null>(null)
    expose(elementProxy(el))

    return () =>
      h(
        "sk-toast",
        {
          ref: el,
          ...elementProps({
            open: props.open,
            duration: props.duration,
            variant: props.variant,
          }),
          onSkOpenChange: props.onDismiss
            ? (event: Event) => {
                // The element reports both edges; only the close edge is a dismiss.
                if (!(event as CustomEvent<{ open: boolean }>).detail.open) props.onDismiss?.()
              }
            : undefined,
        },
        slots.default?.(),
      )
  },
})

export type ToastProps = {
  open?: boolean
  duration?: number
  variant?: "neutral" | "success" | "warning" | "danger"
  onDismiss?: () => void
}
