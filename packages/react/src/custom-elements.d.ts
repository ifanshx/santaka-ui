import type { DetailedHTMLProps, HTMLAttributes } from "react"

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
  variant: string
  size: string
  disabled: boolean
  loading: boolean
  type: string
}

type BaseCustomElement<T extends HTMLElement> = Omit<
  DetailedHTMLProps<HTMLAttributes<T>, T>,
  "class"
> & {
  class?: string
}

type ButtonPropsOf<T extends HTMLElement> = BaseCustomElement<T> & {
  variant?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  type?: string
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
  variant: string
  size: string
  dot: boolean
  statusLabel: string
}

type InputElement = HTMLElement & {
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

type TextareaElement = HTMLElement & {
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
        variant?: string
        size?: string
        dot?: boolean
        "status-label"?: string
      }
      "sk-input": BaseCustomElement<InputElement> & {
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
      "sk-textarea": BaseCustomElement<TextareaElement> & {
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
    }
  }
}

export {}
