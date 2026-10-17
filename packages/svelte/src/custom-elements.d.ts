import type { HTMLAttributes } from "svelte/elements"

/**
 * Type declarations for the Santaka custom elements, Svelte side.
 *
 * Hand-written on purpose, like the React and Vue declarations: the set is
 * small, and a stale generated file is worse than a short hand-maintained one.
 *
 * The file encodes three things:
 * - One element interface per `sk-*` element (the property surface, mirroring
 *   `packages/react/src/custom-elements.d.ts`).
 * - One attribute interface per element, built on Svelte's `HTMLAttributes`
 *   so consumers keep `class`, `style`, `id`, ARIA attributes and DOM events.
 * - Typed `onsk-*` custom-event handlers. Svelte 5 accepts only the `onsk-*`
 *   spelling (`on:sk-change` and `onsk-change` cannot be mixed in one
 *   component); the compiler error itself directs to `onsk-change`.
 *
 * Members added to `SvelteHTMLElements` must be **type aliases**, not
 * interfaces: `SvelteHTMLElements` has an index-signature fallback
 * (`[name: string]: { [name: string]: any }`), and an interface carries no
 * implicit index signature, so an interface member is rejected there.
 *
 * The `web-components` package is the authority when any of this disagrees
 * with a component property; events are dispatched manually (no `@Event()`
 * decorators) with these names and details:
 * - `sk-value-change` — `{ value: string }` for inputs, textarea, select,
 *   radio-group; `{ checked: boolean }` for checkbox and switch.
 * - `sk-open-change` — `{ open: boolean }` for dialog, alert-dialog, toast,
 *   and `sk-accordion-item` (the native `<details>` toggle goes through the
 *   same event, so one listener shape covers all four).
 * - `sk-tab-change` — `{ index: number }` for tabs.
 * - `sk-close-change` — `{ closedBy: string }` for popover (when it lands).
 */

export type SkButtonElement = HTMLElement & {
  variant: string
  size: string
  disabled: boolean
  loading: boolean
  type: string
}

export type SkIconButtonElement = SkButtonElement & {
  label: string
}

export type SkLinkElement = HTMLElement & {
  href: string
  external: boolean
  subtle: boolean
  target?: string
  rel?: string
  download?: string
}

export type SkBadgeElement = HTMLElement & {
  variant: string
  size: string
  dot: boolean
  statusLabel: string
}

export type SkInputElement = HTMLElement & {
  type: string
  variant: string
  size: string
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
  value: string
  defaultValue: string
  minLength?: number
  maxLength?: number
  pattern: string
}

export type SkTextareaElement = HTMLElement & {
  rows: number
  cols?: number
  variant: string
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
  value: string
  defaultValue: string
  minLength?: number
  maxLength?: number
}

export type SkCardElement = HTMLElement & {
  variant: "default" | "outlined" | "bare"
  padding: "none" | "sm" | "md" | "lg"
  heading: string
  subtitle: string
}

export type SkTextElement = HTMLElement & {
  variant: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
  family: "inherit" | "sans" | "display" | "mono"
  muted: boolean
}

export type SkSpinnerElement = HTMLElement & {
  size: "sm" | "md" | "lg"
  label: string
  status: string
}

export type SkSkeletonElement = HTMLElement & {
  variant: "text" | "rect" | "circle"
  direction: "ltr" | "rtl"
}

export type SkLabelElement = HTMLElement & {
  forId: string
  required: boolean
  marker: "after" | "before"
}

export type SkSeparatorElement = HTMLElement & {
  orientation: "horizontal" | "vertical"
  decorative: boolean
}

export type SkDialogElement = HTMLElement & {
  open: boolean
  modal: boolean
  dismissible: boolean
  label: string
}

export type SkAlertDialogElement = HTMLElement & {
  open: boolean
  label: string
  initialFocus: string
}

export type SkToastElement = HTMLElement & {
  open: boolean
  duration: number
  variant: "neutral" | "success" | "warning" | "danger"
}

export type SkTooltipElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "left" | "right"
  delay: number
}

export type SkSelectElement = HTMLElement & {
  options: Array<{ value: string; label: string; disabled?: boolean }>
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  placeholder: string
  value: string
  defaultValue: string
}

// Alert, progress, empty-state, accordion, accordion-item and table mirror
// `packages/react/src/custom-elements.d.ts` and its generated counterpart:
// one element interface, one attributes interface, one `SvelteHTMLElements`
// entry each. None of the six dispatches an event except the accordion item
// (`sk-open-change`, same shape the dialog family dispatches).
export type SkAlertElement = HTMLElement & {
  variant: "neutral" | "primary" | "success" | "warning" | "danger"
  heading: string
}

export type SkProgressElement = HTMLElement & {
  value?: number
  max: number
  label: string
  size: "sm" | "md" | "lg"
}

export type SkEmptyStateElement = HTMLElement & {
  variant: "default" | "bare"
  size: "sm" | "md" | "lg"
  heading: string
  description: string
}

export type SkAccordionElement = HTMLElement & {
  multiple: boolean
  variant: "default" | "plain"
}

export type SkAccordionItemElement = HTMLElement & {
  heading: string
  open: boolean
}

export type SkTableElement = HTMLElement & {
  variant: "default" | "plain"
  density: "default" | "compact"
  striped: boolean
  label: string
}

export type SkTabsElement = HTMLElement & {
  active: number
}

export type SkTabElement = HTMLElement & {
  label: string
}

export type SkTabPanelElement = HTMLElement & {
  hidden: boolean
}

export type SkCheckboxElement = HTMLElement & {
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  checked: boolean
  indeterminate: boolean
  onValueChange: ((checked: boolean) => void) | undefined
}

export type SkSwitchElement = HTMLElement & {
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  checked: boolean
  defaultChecked: boolean
  onValueChange: ((checked: boolean) => void) | undefined
}

export type SkRadioGroupElement = HTMLElement & {
  options: unknown[]
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form: string | undefined
  name: string
  value: string
  onValueChange: ((value: string) => void) | undefined
}

/**
 * The attribute interfaces: component props plus Svelte's full
 * `HTMLAttributes` surface. Every member added to `SvelteHTMLElements` below
 * is a type alias for exactly this reason.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars — one per element, used by the module augmentation below.
export type SkButtonAttributes = HTMLAttributes<SkButtonElement> & {
  variant?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  type?: string
}

export type SkIconButtonAttributes = HTMLAttributes<SkIconButtonElement> & {
  variant?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  type?: string
  label?: string
}

export type SkLinkAttributes = HTMLAttributes<SkLinkElement> & {
  href?: string
  external?: boolean
  subtle?: boolean
  target?: string
  rel?: string
  download?: string
}

export type SkBadgeAttributes = HTMLAttributes<SkBadgeElement> & {
  variant?: string
  size?: string
  dot?: boolean
  "status-label"?: string
}

export type SkInputAttributes = HTMLAttributes<SkInputElement> & {
  type?: string
  variant?: string
  size?: string
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  name?: string
  value?: string
  "default-value"?: string
  minlength?: number
  maxlength?: number
  pattern?: string
  placeholder?: string
  autocomplete?: string
  form?: string
  "onsk-value-change"?: (event: CustomEvent<{ value: string }>) => void
}

export type SkTextareaAttributes = HTMLAttributes<SkTextareaElement> & {
  rows?: number
  cols?: number
  variant?: string
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  name?: string
  value?: string
  "default-value"?: string
  minlength?: number
  maxlength?: number
  placeholder?: string
  form?: string
  "onsk-value-change"?: (event: CustomEvent<{ value: string }>) => void
}

export type SkCheckboxAttributes = HTMLAttributes<SkCheckboxElement> & {
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  form?: string
  name?: string
  value?: string
  checked?: boolean
  "default-checked"?: boolean
  indeterminate?: boolean
  "onsk-value-change"?: (event: CustomEvent<{ checked: boolean }>) => void
}

export type SkSwitchAttributes = HTMLAttributes<SkSwitchElement> & {
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  form?: string
  name?: string
  value?: string
  checked?: boolean
  "default-checked"?: boolean
  "onsk-value-change"?: (event: CustomEvent<{ checked: boolean }>) => void
}

export type SkRadioGroupAttributes = HTMLAttributes<SkRadioGroupElement> & {
  options?: string
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  form?: string
  name?: string
  value?: string
  "default-value"?: string
  "onsk-value-change"?: (event: CustomEvent<{ value: string }>) => void
}

export type SkCardAttributes = HTMLAttributes<SkCardElement> & {
  variant?: "default" | "outlined" | "bare"
  padding?: "none" | "sm" | "md" | "lg"
  heading?: string
  subtitle?: string
}

export type SkTextAttributes = HTMLAttributes<SkTextElement> & {
  variant?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
  family?: "inherit" | "sans" | "display" | "mono"
  muted?: boolean
}

export type SkSpinnerAttributes = HTMLAttributes<SkSpinnerElement> & {
  size?: "sm" | "md" | "lg"
  label?: string
  status?: string
}

export type SkSkeletonAttributes = HTMLAttributes<SkSkeletonElement> & {
  variant?: "text" | "rect" | "circle"
  direction?: "ltr" | "rtl"
}

export type SkLabelAttributes = HTMLAttributes<SkLabelElement> & {
  // `for` is an attribute, not a property: the element reads the host
  // attribute (see the Vue harness, which deliberately does not set `name`
  // and friends as properties for the same reason).
  for?: string
  required?: boolean
  marker?: "after" | "before"
}

export type SkSeparatorAttributes = HTMLAttributes<SkSeparatorElement> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
  label?: string
}

export type SkDialogAttributes = HTMLAttributes<SkDialogElement> & {
  open?: boolean
  modal?: boolean
  dismissible?: boolean
  label?: string
  "onsk-open-change"?: (event: CustomEvent<{ open: boolean }>) => void
}

export type SkAlertDialogAttributes = HTMLAttributes<SkAlertDialogElement> & {
  open?: boolean
  label?: string
  "initial-focus"?: string
  "onsk-open-change"?: (event: CustomEvent<{ open: boolean }>) => void
}

export type SkToastAttributes = HTMLAttributes<SkToastElement> & {
  open?: boolean
  duration?: number
  variant?: "neutral" | "success" | "warning" | "danger"
  "onsk-open-change"?: (event: CustomEvent<{ open: boolean }>) => void
}

export type SkTooltipAttributes = HTMLAttributes<SkTooltipElement> & {
  open?: boolean
  placement?: "top" | "bottom" | "left" | "right"
  delay?: number
}

export type SkSelectAttributes = HTMLAttributes<SkSelectElement> & {
  options?: string
  variant?: "default" | "quiet"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  placeholder?: string
  form?: string
  name?: string
  value?: string
  "default-value"?: string
  "onsk-value-change"?: (event: CustomEvent<{ value: string }>) => void
}

export type SkTabsAttributes = HTMLAttributes<SkTabsElement> & {
  active?: number
  "onsk-tab-change"?: (event: CustomEvent<{ index: number }>) => void
}

export type SkTabAttributes = HTMLAttributes<SkTabElement> & {
  label?: string
}

export type SkTabPanelAttributes = HTMLAttributes<SkTabPanelElement> & Record<string, never>

// Alert, progress, empty-state, accordion, accordion-item and table keep the
// same attribute names as the React and Vue surfaces. Only the accordion item
// dispatches an event of these six (`sk-open-change`, same detail shape the
// dialog family uses); the alert's role follows its variant, so `role` stays a
// consumer attribute on `HTMLAttributes` rather than a prop.
export type SkAlertAttributes = HTMLAttributes<SkAlertElement> & {
  variant?: "neutral" | "primary" | "success" | "warning" | "danger"
  heading?: string
}

export type SkProgressAttributes = HTMLAttributes<SkProgressElement> & {
  value?: number
  max?: number
  label?: string
  size?: "sm" | "md" | "lg"
}

export type SkEmptyStateAttributes = HTMLAttributes<SkEmptyStateElement> & {
  variant?: "default" | "bare"
  size?: "sm" | "md" | "lg"
  heading?: string
  description?: string
}

export type SkAccordionAttributes = HTMLAttributes<SkAccordionElement> & {
  multiple?: boolean
  variant?: "default" | "plain"
}

export type SkAccordionItemAttributes = HTMLAttributes<SkAccordionItemElement> & {
  heading?: string
  open?: boolean
  "onsk-open-change"?: (event: CustomEvent<{ open: boolean }>) => void
}

export type SkTableAttributes = HTMLAttributes<SkTableElement> & {
  variant?: "default" | "plain"
  density?: "default" | "compact"
  striped?: boolean
  label?: string
}

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "sk-button": SkButtonAttributes
    "sk-icon-button": SkIconButtonAttributes
    "sk-link": SkLinkAttributes
    "sk-badge": SkBadgeAttributes
    "sk-input": SkInputAttributes
    "sk-textarea": SkTextareaAttributes
    "sk-checkbox": SkCheckboxAttributes
    "sk-switch": SkSwitchAttributes
    "sk-radio-group": SkRadioGroupAttributes
    "sk-card": SkCardAttributes
    "sk-text": SkTextAttributes
    "sk-spinner": SkSpinnerAttributes
    "sk-skeleton": SkSkeletonAttributes
    "sk-label": SkLabelAttributes
    "sk-separator": SkSeparatorAttributes
    "sk-dialog": SkDialogAttributes
    "sk-alert-dialog": SkAlertDialogAttributes
    "sk-toast": SkToastAttributes
    "sk-tooltip": SkTooltipAttributes
    "sk-select": SkSelectAttributes
    "sk-tabs": SkTabsAttributes
    "sk-tab": SkTabAttributes
    "sk-tab-panel": SkTabPanelAttributes
    "sk-alert": SkAlertAttributes
    "sk-progress": SkProgressAttributes
    "sk-empty-state": SkEmptyStateAttributes
    "sk-accordion": SkAccordionAttributes
    "sk-accordion-item": SkAccordionItemAttributes
    "sk-table": SkTableAttributes
  }
}

export {}
