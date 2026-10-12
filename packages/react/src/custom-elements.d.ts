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
    }
  }
}

export {}
