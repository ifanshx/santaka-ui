import { forwardRef, useCallback, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Tabs - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Fully compositional: no serialization crosses the boundary. `TabsList`
 * renders the tablist slot the widget queries for; `Tab` and `TabPanel` are
 * the authored shapes; the widget computes and writes every ARIA relationship
 * itself. `active` is the controlled write — omit it and the widget owns its
 * own state; either way the adapter reports changes through `onTabChange`,
 * subscribed imperatively because React's synthetic system does not know the
 * custom event name.
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

export type TabsListProps = {
  className?: string
  children?: ReactNode
}

export function TabsList({ className, children }: TabsListProps): ReactElement {
  return (
    <div slot="tablist" data-slot="tablist" className={cn(className)}>
      {children}
    </div>
  )
}

export type TabProps = {
  label?: string
  className?: string
  children?: ReactNode
}

export function Tab({ label, className, children }: TabProps): ReactElement {
  return (
    <sk-tab label={label} class={cn(className)}>
      {children}
    </sk-tab>
  )
}

export type TabPanelProps = {
  className?: string
  children?: ReactNode
}

export function TabPanel({ className, children }: TabPanelProps): ReactElement {
  return <sk-tab-panel class={cn(className)}>{children}</sk-tab-panel>
}
export type TabsProps = {
  /** Controlled active index. Omit for uncontrolled — the widget owns it. */
  active?: number
  onTabChange?: (index: number) => void
  className?: string
  children?: ReactNode
}

export const Tabs = forwardRef<SkTabsElement, TabsProps>(function Tabs(
  { active, onTabChange, className, children },
  ref,
): ReactElement {
  // The event is subscribed imperatively: React's synthetic system does not
  // know the custom event name, and a lowercase `onsk-tab-change` attribute
  // would set a property, not a listener.
  const hostRef = useCallback(
    (element: SkTabsElement | null) => {
      if (!element) return
      if (typeof ref === "function") ref(element)
      else if (ref) ref.current = element

      if (!onTabChange) return
      const listener = (event: Event) => {
        onTabChange((event as CustomEvent<{ index: number }>).detail.index)
      }
      element.addEventListener("sk-tab-change", listener)
    },
    [onTabChange, ref],
  )

  return (
    <sk-tabs ref={hostRef} class={cn(className)} active={active}>
      {children}
    </sk-tabs>
  )
})
