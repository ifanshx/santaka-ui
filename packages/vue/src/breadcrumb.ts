import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Breadcrumb — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. This renders `<sk-breadcrumb>` and forwards
 * the same props, so the `<nav aria-label>` wrapper, the `<ol>`, and the
 * `aria-current="page"` on the last item are all owned by
 * `@santaka-ui/web-components` — not reimplemented here.
 *
 * `items` is serialized rather than passed as a property: the element declares it
 * as a string prop and parses it once, which is the same route `Select` takes for
 * `options`. Passing the array through as a property would leave the element with
 * a Vue-reactive proxy it never asked for.
 */
export type Crumb = { label: string; href?: string }
export type SkBreadcrumbElement = HTMLElement & {
  items: string | Crumb[]
  label: string
}

export const Breadcrumb = defineComponent({
  name: "SkBreadcrumb",
  props: {
    items: { type: Array as unknown as () => Crumb[], required: true },
    label: optionalProp<string>(String),
  },
  setup(props, { expose }) {
    const el = ref<SkBreadcrumbElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-breadcrumb", {
        ref: el,
        ...elementProps({
          items: props.items ? JSON.stringify(props.items) : undefined,
          label: props.label,
        }),
      })
  },
})

export type BreadcrumbProps = {
  items: Crumb[]
  label?: string
}
