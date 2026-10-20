import type { DetailedHTMLProps, HTMLAttributes } from "react"
import type {
  AlertVariant,
  BadgeSize,
  BadgeVariant,
  ButtonSize,
  ButtonType,
  ButtonVariant,
  CheckboxSize,
  CheckboxVariant,
  EmptyStateSize,
  EmptyStateVariant,
  InputType,
  ProgressSize,
  RadioGroupSize,
  RadioGroupVariant,
  SwitchSize,
  SwitchVariant,
} from "./index.js"

/**
 * JSX declarations for the Santaka custom elements.
 *
 * The React adapters render the tags directly, so TypeScript needs to know the
 * tag names and their attributes. These are deliberately hand-written rather
 * than generated at build time: the set is small, and a stale generated file is
 * worse than a short hand-maintained one. The contract they encode is section 4's
 * Component API conventions.
 *
 * `class` is declared explicitly because React's own `className` maps to it on
 * a custom element; the adapters use `class` for that reason.
 */

type ButtonElement = HTMLElement & {
  variant: ButtonVariant
  size: ButtonSize
  disabled: boolean
  loading: boolean
  type: ButtonType
}

type BaseCustomElement<T extends HTMLElement> = Omit<
  DetailedHTMLProps<HTMLAttributes<T>, T>,
  "class"
> & {
  class?: string
}

type ButtonPropsOf<T extends HTMLElement> = BaseCustomElement<T> & {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: ButtonType
}

type LinkElement = HTMLElement & {
  href: string
  external: boolean
  subtle: boolean
  target?: string
  rel?: string
  download?: string
}

type BadgeElement = HTMLElement & {
  variant: BadgeVariant
  size: BadgeSize
  dot: boolean
  statusLabel: string
}

type AvatarElement = HTMLElement & {
  name: string
  src: string
  size: "sm" | "md" | "lg"
}

type BannerElement = HTMLElement & {
  variant: "neutral" | "primary" | "success" | "warning" | "danger"
  heading: string
  fullWidth: boolean
}

type AvatarGroupElement = HTMLElement & {
  max: number
  label: string
  size: "sm" | "md" | "lg"
}

type FieldElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  required: boolean
  disabled: boolean
}

type KbdElement = HTMLElement & {
  size: "sm" | "md"
}

type SliderElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  name: string
  min: number
  max: number
  step: number
  value: number
  showValue: boolean
  format: string
}

type BreadcrumbElement = HTMLElement & {
  items: string | Array<{ label: string; href?: string }>
  label: string
}

type PaginationElement = HTMLElement & {
  count: number
  page: number
  siblings: number
  label: string
  href: string
}

type DrawerElement = HTMLElement & {
  open: boolean
  side: "start" | "end"
  modal: boolean
  dismissible: boolean
  label: string
}

type TakaElement = HTMLElement & {
  mood: "idle" | "wave" | "bounce"
  size: "sm" | "md" | "lg"
}

type PopoverElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "start" | "end"
  label: string
}

type ComboboxElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  name: string
  placeholder: string
  options: string | Array<{ value: string; label: string }>
  value: string
}

type InputElement = HTMLElement & {
  type: InputType
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
  autocomplete?: string
  placeholder: string
  form?: string | undefined
  value: string
  defaultValue: string
  minLength?: number
  maxLength?: number
  pattern: string
}

type TextareaElement = HTMLElement & {
  rows: number
  cols?: number
  variant: "default" | "quiet"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
  placeholder: string
  form?: string | undefined
  value: string
  defaultValue: string
  minLength?: number
  maxLength?: number
}

type CardElement = HTMLElement & {
  variant: "default" | "outlined" | "bare"
  padding: "none" | "sm" | "md" | "lg"
  heading: string
  subtitle: string
}

type TextElement = HTMLElement & {
  variant: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
  family: "inherit" | "sans" | "display" | "mono"
  muted: boolean
}

type SpinnerElement = HTMLElement & {
  size: "sm" | "md" | "lg"
  label: string
  status: string
}

type SkeletonElement = HTMLElement & {
  variant: "text" | "rect" | "circle"
  direction: "ltr" | "rtl"
}

type LabelElement = HTMLElement & {
  forId: string
  required: boolean
  marker: "after" | "before"
}

type SeparatorElement = HTMLElement & {
  orientation: "horizontal" | "vertical"
  decorative: boolean
  label: string
}

type DialogElement = HTMLElement & {
  open: boolean
  modal: boolean
  dismissible: boolean
  label: string
}

type AlertDialogElement = HTMLElement & {
  open: boolean
  label: string
  initialFocus: string
}

type ToastElement = HTMLElement & {
  open: boolean
  duration: number
  variant: "neutral" | "success" | "warning" | "danger"
}

type TooltipElement = HTMLElement & {
  open: boolean
  placement: "top" | "bottom" | "left" | "right"
  delay: number
}

type SelectElement = HTMLElement & {
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
  form?: string | undefined
  value: string
  defaultValue: string
}

type AlertElement = HTMLElement & {
  variant: "neutral" | "primary" | "success" | "warning" | "danger"
  heading: string
}

type ProgressElement = HTMLElement & {
  value?: number
  max: number
  label: string
  size: "sm" | "md" | "lg"
}

type EmptyStateElement = HTMLElement & {
  variant: "default" | "bare"
  size: "sm" | "md" | "lg"
  heading: string
  description: string
}

type AccordionElement = HTMLElement & {
  multiple: boolean
  variant: "default" | "plain"
}

type AccordionItemElement = HTMLElement & {
  heading: string
  open: boolean
}

type TableElement = HTMLElement & {
  variant: "default" | "plain"
  density: "default" | "compact"
  striped: boolean
  label: string
}

type TabsElement = HTMLElement & {
  active: number
}

type TabElement = HTMLElement & {
  label: string
}

type TabPanelElement = HTMLElement & {
  hidden: boolean
}

type CheckboxElement = HTMLElement & {
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form?: string | undefined
  checked: boolean
  defaultChecked: boolean
  value: string
  indeterminate: boolean
}

type SwitchElement = HTMLElement & {
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form?: string | undefined
  value: string
  checked: boolean
  defaultChecked: boolean
}

type RadioGroupElement = HTMLElement & {
  options: unknown[]
  variant: "default" | "quiet"
  size: "sm" | "md" | "lg"
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  required: boolean
  form?: string | undefined
  name: string
  value: string
  defaultValue: string
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sk-button": ButtonPropsOf<ButtonElement>
      "sk-icon-button": ButtonPropsOf<ButtonElement> & { label?: string }
      "sk-link": BaseCustomElement<LinkElement> & {
        href?: string
        external?: boolean
        subtle?: boolean
        target?: string
        rel?: string
        download?: string
      }
      "sk-badge": BaseCustomElement<BadgeElement> & {
        variant?: BadgeVariant
        size?: BadgeSize
        dot?: boolean
        "status-label"?: string
      }
      "sk-avatar": BaseCustomElement<AvatarElement> & {
        name?: string
        src?: string
        size?: "sm" | "md" | "lg"
      }
      "sk-banner": BaseCustomElement<BannerElement> & {
        variant?: "neutral" | "primary" | "success" | "warning" | "danger"
        heading?: string
        "full-width"?: "false"
        "aria-label"?: string
        "aria-labelledby"?: string
      }
      "sk-avatar-group": BaseCustomElement<AvatarGroupElement> & {
        max?: number
        label?: string
        size?: "sm" | "md" | "lg"
      }
      "sk-kbd": BaseCustomElement<KbdElement> & {
        size?: "sm" | "md"
      }
      "sk-field": BaseCustomElement<FieldElement> & {
        label?: string
        description?: string
        error?: string
        invalid?: boolean
        required?: boolean
        disabled?: boolean
      }
      "sk-slider": BaseCustomElement<SliderElement> & {
        label?: string
        description?: string
        error?: string
        invalid?: boolean
        disabled?: boolean
        name?: string
        min?: number
        max?: number
        step?: number
        value?: number
        "show-value"?: boolean
        format?: string
      }
      "sk-breadcrumb": BaseCustomElement<BreadcrumbElement> & {
        items?: string | Array<{ label: string; href?: string }>
        label?: string
      }
      "sk-pagination": BaseCustomElement<PaginationElement> & {
        count?: number
        page?: number
        siblings?: number
        label?: string
        href?: string
      }
      "sk-drawer": BaseCustomElement<DrawerElement> & {
        open?: boolean
        side?: "start" | "end"
        modal?: boolean
        dismissible?: boolean
        label?: string
      }
      "sk-taka": BaseCustomElement<TakaElement> & {
        mood?: "idle" | "wave" | "bounce"
        size?: "sm" | "md" | "lg"
      }
      "sk-popover": BaseCustomElement<PopoverElement> & {
        open?: boolean
        placement?: "top" | "bottom" | "start" | "end"
        label?: string
      }
      "sk-combobox": BaseCustomElement<ComboboxElement> & {
        label?: string
        description?: string
        error?: string
        invalid?: boolean
        disabled?: boolean
        name?: string
        placeholder?: string
        options?: string | Array<{ value: string; label: string }>
        value?: string
      }
      "sk-input": BaseCustomElement<InputElement> & {
        type?: InputType
        variant?: "default" | "quiet"
        size?: "sm" | "md" | "lg"
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
      "sk-textarea": BaseCustomElement<TextareaElement> & {
        rows?: number
        cols?: number
        variant?: "default" | "quiet"
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
      "sk-checkbox": BaseCustomElement<CheckboxElement> & {
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
      "sk-switch": BaseCustomElement<SwitchElement> & {
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
      "sk-radio-group": BaseCustomElement<RadioGroupElement> & {
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
      "sk-card": BaseCustomElement<CardElement> & {
        variant?: "default" | "outlined" | "bare"
        padding?: "none" | "sm" | "md" | "lg"
        heading?: string
        subtitle?: string
      }
      "sk-text": BaseCustomElement<TextElement> & {
        variant?:
          "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display-sm" | "display"
        family?: "inherit" | "sans" | "display" | "mono"
        muted?: boolean
      }
      "sk-spinner": BaseCustomElement<SpinnerElement> & {
        size?: "sm" | "md" | "lg"
        label?: string
        status?: string
      }
      "sk-skeleton": BaseCustomElement<SkeletonElement> & {
        variant?: "text" | "rect" | "circle"
        direction?: "ltr" | "rtl"
      }
      "sk-label": BaseCustomElement<LabelElement> & {
        for?: string
        required?: boolean
        marker?: "after" | "before"
      }
      "sk-separator": BaseCustomElement<SeparatorElement> & {
        orientation?: "horizontal" | "vertical"
        decorative?: boolean
        label?: string
      }
      "sk-dialog": BaseCustomElement<DialogElement> & {
        open?: boolean
        modal?: boolean
        dismissible?: boolean
        label?: string
        onskOpenChange?: (event: CustomEvent<{ open: boolean }>) => void
      }
      "sk-alert-dialog": BaseCustomElement<AlertDialogElement> & {
        open?: boolean
        label?: string
        "initial-focus"?: string
        onskOpenChange?: (event: CustomEvent<{ open: boolean }>) => void
      }
      "sk-toast": BaseCustomElement<ToastElement> & {
        open?: boolean
        duration?: number
        variant?: "neutral" | "success" | "warning" | "danger"
        onskOpenChange?: (event: CustomEvent<{ open: boolean }>) => void
      }
      "sk-tooltip": BaseCustomElement<TooltipElement> & {
        open?: boolean
        placement?: "top" | "bottom" | "left" | "right"
        delay?: number
      }
      "sk-select": BaseCustomElement<SelectElement> & {
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
      "sk-tabs": BaseCustomElement<TabsElement> & {
        active?: number
      }
      "sk-tab": BaseCustomElement<TabElement> & {
        label?: string
      }
      "sk-alert": BaseCustomElement<AlertElement> & {
        variant?: "neutral" | "primary" | "success" | "warning" | "danger"
        heading?: string
      }
      "sk-progress": BaseCustomElement<ProgressElement> & {
        value?: number
        max?: number
        label?: string
        size?: "sm" | "md" | "lg"
      }
      "sk-empty-state": BaseCustomElement<EmptyStateElement> & {
        variant?: "default" | "bare"
        size?: "sm" | "md" | "lg"
        heading?: string
        description?: string
      }
      "sk-accordion": BaseCustomElement<AccordionElement> & {
        multiple?: boolean
        variant?: "default" | "plain"
      }
      "sk-accordion-item": BaseCustomElement<AccordionItemElement> & {
        heading?: string
        open?: boolean
      }
      "sk-table": BaseCustomElement<TableElement> & {
        variant?: "default" | "plain"
        density?: "default" | "compact"
        striped?: boolean
        label?: string
      }
      "sk-tab-panel": BaseCustomElement<TabPanelElement> & {}
    }
  }
}

export {}
