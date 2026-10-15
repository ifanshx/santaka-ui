import { defineComponent, h, ref, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * AlertDialog — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The parts follow the Dialog's compound naming: `AlertDialog` and
 * `AlertDialogContent` over slot attributes. There is no `AlertDialogTrigger` —
 * an alert is raised by the application in response to something, never opened
 * by the user browsing.
 *
 * `initialFocus` is written as the **`initial-focus` attribute** rather than the
 * property. Stencil's default mapping for a camelCase `@Prop()` is the
 * kebab-case attribute, so `initial-focus` is the name the element observes, and
 * it is the spelling the plain-HTML example authors. Writing the hyphenated key
 * makes the choice explicit: Vue's `key in element` test is false for
 * `"initial-focus"`, so it is always set as an attribute and never depends on
 * whether the element has upgraded yet.
 */
export type SkAlertDialogElement = HTMLElement & {
  open: boolean
  label: string
  initialFocus: string
}

export const AlertDialogContent = defineComponent({
  name: "SkAlertDialogContent",
  props: {
    title: optionalProp<string>(String),
  },
  setup(props, { slots }) {
    return () => {
      const children: VNode[] = []
      if (props.title) children.push(h("span", { slot: "title" }, props.title))
      children.push(...(slots.default?.() ?? []))
      return children
    }
  },
})

export type AlertDialogContentProps = {
  title?: string
  default?: () => VNode[]
}

export const AlertDialog = defineComponent({
  name: "SkAlertDialog",
  props: {
    open: optionalProp<boolean>(Boolean),
    /**
     * Accessible name. An interruption that announces nothing is a modal
     * mystery — prefer a real heading in the title slot.
     */
    label: optionalProp<string>(String),
    /** Selector for the control receiving initial focus — the default action. */
    initialFocus: optionalProp<string>(String),
    /** Fires on every close, which only ever follows a decision. */
    onOpenChange: optionalProp<(open: boolean) => void>(Function),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, expose }) {
    const el = ref<SkAlertDialogElement | null>(null)
    expose(elementProxy(el))

    return () =>
      h(
        "sk-alert-dialog",
        {
          ref: el,
          ...elementProps({
            open: props.open,
            label: props.label,
          }),
          // Written as the attribute: that is the spelling the element observes,
          // and it matches what the plain-HTML example authors.
          "initial-focus": props.initialFocus,
          onSkOpenChange: props.onOpenChange
            ? (event: Event) =>
                props.onOpenChange?.((event as CustomEvent<{ open: boolean }>).detail.open)
            : undefined,
        },
        slots.default?.(),
      )
  },
})

export type AlertDialogProps = {
  open?: boolean
  label?: string
  initialFocus?: string
  onOpenChange?: (open: boolean) => void
  default?: () => VNode[]
}
