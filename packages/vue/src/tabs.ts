import { defineComponent, h, ref, type SlotsType, type VNode } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Tabs — Vue 3 adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Fully compositional: no serialization crosses the boundary. `TabsList` renders
 * the tablist slot the widget queries for; `Tab` and `TabPanel` are the authored
 * shapes; the widget computes and writes every ARIA relationship itself.
 * `active` is the controlled write — omit it and the widget owns its own state;
 * either way the adapter reports changes through `onTabChange`.
 *
 * The `data-slot="tablist"` attribute on `TabsList` is not decoration: the
 * element queries for the tablist by that attribute, so it is the contract
 * between the two packages rather than a styling hook.
 */
export type SkTabsElement = HTMLElement & {
  active: number
}

export type SkTabElement = HTMLElement & {
  label: string
}

export type SkTabPanelElement = HTMLElement & {
  hidden: boolean
}

export const TabsList = defineComponent({
  name: "SkTabsList",
  setup(_props, { slots }) {
    return () => h("div", { slot: "tablist", "data-slot": "tablist" }, slots.default?.())
  },
})

export type TabsListProps = {
  default?: () => VNode[]
}

export const Tab = defineComponent({
  name: "SkTab",
  props: {
    label: optionalProp<string>(String),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots }) {
    return () => h("sk-tab", elementProps({ label: props.label }), slots.default?.())
  },
})

export type TabProps = {
  label?: string
  default?: () => VNode[]
}

export const TabPanel = defineComponent({
  name: "SkTabPanel",
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { slots }) {
    return () => h("sk-tab-panel", null, slots.default?.())
  },
})

export type TabPanelProps = {
  default?: () => VNode[]
}

export const Tabs = defineComponent({
  name: "SkTabs",
  props: {
    /** Controlled active index. Omit for uncontrolled — the widget owns it. */
    active: optionalProp<number>(Number),
    onTabChange: optionalProp<(index: number) => void>(Function),
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, expose }) {
    const el = ref<SkTabsElement | null>(null)
    expose(elementProxy(el))

    return () =>
      h(
        "sk-tabs",
        {
          ref: el,
          ...elementProps({ active: props.active }),
          onSkTabChange: props.onTabChange
            ? (event: Event) =>
                props.onTabChange?.((event as CustomEvent<{ index: number }>).detail.index)
            : undefined,
        },
        slots.default?.(),
      )
  },
})

export type TabsProps = {
  active?: number
  onTabChange?: (index: number) => void
  default?: () => VNode[]
}
