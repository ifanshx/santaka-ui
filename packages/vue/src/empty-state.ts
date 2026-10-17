import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * EmptyState — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Static surface: props onto the custom element, children into the default and
 * named slots. Slotting stays the browser's light-DOM assignment, as in Card —
 * `<template slot="icon">` arrives as a child of the host with its `slot`
 * attribute intact and the element's `<slot name="icon">` picks it up.
 */
export type SkEmptyStateElement = HTMLElement & {
  variant: "default" | "bare"
  size: "sm" | "md" | "lg"
  heading: string
  description: string
}

export const EmptyState = defineComponent({
  name: "SkEmptyState",
  props: {
    /** `bare` drops the stroked fill for an empty state nested inside a card. */
    variant: optionalProp<"default" | "bare">(String),
    /** Block padding and glyph size. */
    size: optionalProp<"sm" | "md" | "lg">(String),
    /** Heading text, rendered as a `<span>` — a real heading belongs in the body. */
    heading: optionalProp<string>(String),
    /** Supporting text under the heading. */
    description: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: Slot; icon?: Slot; actions?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkEmptyStateElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-empty-state",
        {
          ref: el,
          ...elementProps({
            variant: props.variant,
            size: props.size,
            heading: props.heading,
            description: props.description,
          }),
        },
        slots.default?.(),
      )
  },
})

export type EmptyStateProps = {
  variant?: "default" | "bare"
  size?: "sm" | "md" | "lg"
  heading?: string
  description?: string
}
