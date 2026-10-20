import { defineComponent, h, ref, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Drawer — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. The modal machinery — `showDialog`/`hideDialog`,
 * the focus trap, focus return, and the one `sk-open-change` every close path
 * reports through — is owned by `@santaka-ui/web-components`.
 *
 * `side` is `start`/`end` rather than `left`/`right`, which is what makes the
 * drawer mirror in RTL without the consumer doing anything (ADR-016).
 */
export type SkDrawerElement = HTMLElement & {
  open: boolean
  side: "start" | "end"
  modal: boolean
  dismissible: boolean
  label: string
}

export const Drawer = defineComponent({
  name: "SkDrawer",
  props: {
    open: optionalProp<boolean>(Boolean),
    side: optionalProp<"start" | "end">(String),
    modal: optionalProp<boolean>(Boolean),
    dismissible: optionalProp<boolean>(Boolean),
    label: optionalProp<string>(String),
    onOpenChange: optionalProp<(open: boolean) => void>(Function),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, emit, expose }) {
    const el = ref<SkDrawerElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-drawer",
        {
          ref: el,
          ...elementProps({
            open: props.open,
            side: props.side,
            modal: props.modal,
            dismissible: props.dismissible,
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

export type DrawerProps = {
  open?: boolean
  side?: "start" | "end"
  modal?: boolean
  dismissible?: boolean
  label?: string
  onOpenChange?: (open: boolean) => void
  default?: () => VNode[]
}
