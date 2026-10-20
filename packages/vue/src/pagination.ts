import { defineComponent, h, ref } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Pagination — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. The `<nav>` labeling, the ellipsis arithmetic,
 * and `aria-current="page"` on the current page are owned by
 * `@santaka-ui/web-components`.
 *
 * `sk-page-change` is dispatched manually rather than through Stencil's
 * `@Event()`, because the decorator leaks its internal `EventEmitter` type into
 * the public `.d.ts` — the note in the element source. The listener below is the
 * same either way; only the generated types differ.
 */
export type SkPaginationElement = HTMLElement & {
  count: number
  page: number
  siblings: number
  label: string
  href: string
}

export const Pagination = defineComponent({
  name: "SkPagination",
  props: {
    count: { type: Number, required: true },
    page: optionalProp<number>(Number),
    siblings: optionalProp<number>(Number),
    label: optionalProp<string>(String),
    href: optionalProp<string>(String),
    onPageChange: optionalProp<(page: number) => void>(Function),
  },
  setup(props, { emit, expose }) {
    const el = ref<SkPaginationElement | null>(null)
    expose(elementProxy(el))
    return () =>
      h("sk-pagination", {
        ref: el,
        ...elementProps({
          count: props.count,
          page: props.page,
          siblings: props.siblings,
          label: props.label,
          href: props.href,
        }),
        onSkPageChange: (event: Event) => {
          const page = (event as CustomEvent<{ page: number }>).detail.page
          props.onPageChange?.(page)
          emit("update:page", page)
        },
      })
  },
})

export type PaginationProps = {
  count: number
  page?: number
  siblings?: number
  label?: string
  href?: string
  onPageChange?: (page: number) => void
}
