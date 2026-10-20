import { defineComponent, h, ref, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Popover — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. The `role="dialog"`, the
 * `aria-haspopup`/`aria-expanded` pair on the trigger, focus moving in on open and
 * returning on close, and Escape and outside-click dismissal are all owned by
 * `@santaka-ui/web-components`.
 *
 * `placement` takes `start`/`end` rather than `left`/`right` so it mirrors in RTL
 * without a consumer change (ADR-016).
 */
export type SkPopoverElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "start" | "end"
  label: string
}

export const Popover = defineComponent({
  name: "SkPopover",
  props: {
    open: optionalProp<boolean>(Boolean),
    placement: optionalProp<"top" | "bottom" | "start" | "end">(String),
    label: optionalProp<string>(String),
    onOpenChange: optionalProp<(open: boolean) => void>(Function),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, emit, expose }) {
    const el = ref<SkPopoverElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-popover",
        {
          ref: el,
          ...elementProps({
            open: props.open,
            placement: props.placement,
            label: props.label,
          }),
          onSkOpenChange: (event: Event) => {
            const open = (event as CustomEvent<{ open: boolean }>).detail.open
            props.onOpenChange?.(open)
            emit("update:open", open)
          },
        },
        slots.default?.(),
      )
  },
})

export type PopoverProps = {
  open?: boolean
  placement?: "top" | "bottom" | "start" | "end"
  label?: string
  onOpenChange?: (open: boolean) => void
  default?: () => VNode[]
}
