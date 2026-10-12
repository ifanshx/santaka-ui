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
    }
  }
}

export {}
