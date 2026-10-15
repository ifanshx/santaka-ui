import { defineComponent, h, ref, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Dialog — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Compound naming follows section 4: the flat exports are `Dialog`,
 * `DialogTrigger`, and `DialogContent`, and a namespace object is also exported.
 * The web component uses named slots per the same section, so the parts are
 * conveniences over `slot` attributes — `DialogTrigger` renders a span with
 * `slot="trigger"`, and `DialogContent` is the fragment that receives everything
 * else.
 *
 * That a `slot` attribute written on a child *vnode* survives to the DOM is
 * measured, not assumed: `h("sk-dialog", null, [h("span", { slot: "trigger" })])`
 * renders `<sk-dialog><span slot="trigger">…</span></sk-dialog>`. Vue treats
 * `slot` as an ordinary attribute here because the parent is a custom element,
 * not a component with named-slot children — which is exactly what this adapter
 * needs, since the light DOM child is what the element queries.
 *
 * Open/close is the component's state; the adapter observes `sk-open-change` and
 * hands the value to `onOpenChange`. There is no `defaultOpen`, per section 4's
 * state-ownership rule.
 */
export type SkDialogElement = HTMLElement & {
  open: boolean
  modal: boolean
  dismissible: boolean
  label: string
}

export const DialogTrigger = defineComponent({
  name: "SkDialogTrigger",
  setup(_props, { slots }) {
    return () => h("span", { slot: "trigger" }, slots.default?.())
  },
})

export type DialogTriggerProps = {
  /** The trigger content. Must be focusable; a bare span gives keyboard users nothing. */
  default?: () => VNode[]
}

export const DialogContent = defineComponent({
  name: "SkDialogContent",
  props: {
    /** Rendered in the `title` slot; a real heading doubles as the dialog's name. */
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

export type DialogContentProps = {
  title?: string
  default?: () => VNode[]
}

export const Dialog = defineComponent({
  name: "SkDialog",
  props: {
    /** Controlled open state. Omit for uncontrolled; the trigger drives it. */
    open: optionalProp<boolean>(Boolean),
    /** Non-modal renders inline without blocking the page. */
    modal: optionalProp<boolean>(Boolean),
    /**
     * Closes when the backdrop is clicked. Off by default: dialogs holding form
     * input lose work to a stray click.
     */
    dismissible: optionalProp<boolean>(Boolean),
    /** Accessible name when no slotted heading exists. */
    label: optionalProp<string>(String),
    /** Fires for user interaction in both controlled and uncontrolled modes. */
    onOpenChange: optionalProp<(open: boolean) => void>(Function),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, expose }) {
    const el = ref<SkDialogElement | null>(null)
    expose(elementProxy(el))

    return () =>
      h(
        "sk-dialog",
        {
          ref: el,
          ...elementProps({
            open: props.open,
            modal: props.modal,
            dismissible: props.dismissible,
            label: props.label,
          }),
          // Unlike React, Vue does not need an imperative listener here: its
          // `isOn` check accepts `onSkOpenChange` (the third character is
          // uppercase) and hyphenates the remainder, so this is a real listener
          // on `sk-open-change`. React's rule is the opposite — a lowercase
          // `onsk-open-change` there would set a property, not subscribe.
          onSkOpenChange: props.onOpenChange
            ? (event: Event) =>
                props.onOpenChange?.((event as CustomEvent<{ open: boolean }>).detail.open)
            : undefined,
        },
        slots.default?.(),
      )
  },
})

export type DialogProps = {
  open?: boolean
  modal?: boolean
  dismissible?: boolean
  label?: string
  onOpenChange?: (open: boolean) => void
  default?: () => VNode[]
}
