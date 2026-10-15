import { defineComponent, h, ref, type Slot, type SlotsType } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Link — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * `href` is required for the same reason `IconButton`'s `label` is: a link with
 * no destination is a mistake. The React adapter makes it a type error; Vue
 * reports it as a missing required prop in development. `href=""` is still the
 * explicit way to ask for the disabled rendering.
 */
export type SkLinkElement = HTMLElement & {
  href: string
  external: boolean
  subtle: boolean
  target?: string
  rel?: string
  download?: string
}

export const Link = defineComponent({
  name: "SkLink",
  props: {
    /** The destination. */
    href: { type: String, required: true },
    /** Marks a link that leaves the application: new tab, safe rel, and an icon. */
    external: optionalProp<boolean>(Boolean),
    /** Suppresses the underline until hover or focus. */
    subtle: optionalProp<boolean>(Boolean),
    /** Opened in a new tab without the external treatment. */
    target: optionalProp<string>(String),
    /** Forwarded to the underlying anchor. */
    rel: optionalProp<string>(String),
    /** Passed through for download links. */
    download: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: Slot }>,
  setup(props, { slots, expose }) {
    const el = ref<SkLinkElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h(
        "sk-link",
        {
          ref: el,
          ...elementProps({
            href: props.href,
            external: props.external,
            subtle: props.subtle,
            target: props.target,
            rel: props.rel,
            download: props.download,
          }),
        },
        slots.default?.(),
      )
  },
})

export type LinkProps = {
  href: string
  external?: boolean
  subtle?: boolean
  target?: string
  rel?: string
  download?: string
}
