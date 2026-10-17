import { defineComponent, h, ref, type Slot, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Accordion — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Two thin components, mirroring the element's composition: `Accordion` gets the
 * group props and reports `sk-open-change` through `onOpenChange`; `AccordionItem`
 * gets the item's `heading` and the controlled `open` write. `multiple` tells the
 * group what it is for; `open` on the item writes the reflected property the
 * element already mirrors back on a user toggle.
 */
export type SkAccordionElement = HTMLElement & {
  multiple: boolean
  variant: "default" | "plain"
}

export type SkAccordionItemElement = HTMLElement & {
  heading: string
  open: boolean
}

export const AccordionItem = defineComponent({
  name: "SkAccordionItem",
  props: {
    /** The summary text, rendered as a `<span>` inside the native `<summary>`. */
    heading: optionalProp<string>(String),
    /** Controlled open state, mirroring `<details open>`. Omit for uncontrolled. */
    open: optionalProp<boolean>(Boolean),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkAccordionItemElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-accordion-item",
        {
          ref: el,
          ...elementProps({
            heading: props.heading,
            open: props.open,
          }),
        },
        slots.default?.(),
      )
  },
})

export type AccordionItemProps = {
  heading?: string
  open?: boolean
}

export const Accordion = defineComponent({
  name: "SkAccordion",
  props: {
    /** Whether several panels may be open at once. */
    multiple: optionalProp<boolean>(Boolean),
    /** `plain` drops the container chrome for an accordion inside a card. */
    variant: optionalProp<"default" | "plain">(String),
    /** Fires for a user toggle of any item, bubbling from the item that opened. */
    onOpenChange: optionalProp<(open: boolean) => void>(Function),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, expose }) {
    const el = ref<SkAccordionElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-accordion",
        {
          ref: el,
          ...elementProps({
            multiple: props.multiple,
            variant: props.variant,
          }),
          // One listener on the group host, per the element's own comment: the
          // items' `sk-open-change` bubbles here, so this survives items added
          // later without a MutationObserver.
          onSkOpenChange: props.onOpenChange
            ? (event: Event) =>
                props.onOpenChange?.((event as CustomEvent<{ open: boolean }>).detail.open)
            : undefined,
        },
        slots.default?.(),
      )
  },
})

export type AccordionProps = {
  multiple?: boolean
  variant?: "default" | "plain"
  onOpenChange?: (open: boolean) => void
  default?: () => VNode[]
}
