import type { DetailedHTMLProps, HTMLAttributes } from "react"

/**
 * JSX declarations for the Santaka custom elements.
 *
 * The React adapter renders `sk-button` directly, so TypeScript needs to know
 * the tag and its attribute names. These are deliberately hand-written rather
 * than generated at build time: the set is small, and a stale generated file
 * is worse than a short hand-maintained one. The contract they encode is
 * section 4's Component API conventions.
 */

type CustomElement<T extends HTMLElement> = Omit<
  DetailedHTMLProps<HTMLAttributes<T>, T>,
  "class"
> & {
  class?: string
  variant?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  type?: string
}
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sk-button": CustomElement<HTMLElement & { variant: string }>
    }
  }
}

export {}
