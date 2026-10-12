import { forwardRef, type ReactElement, type ReactNode } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Link — React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * `href` is required for the same reason `IconButton`'s `label` is: a link with
 * no destination is a mistake, and the type makes it one the compiler catches.
 * Use `href=""` explicitly if you really want the no-destination rendering, and
 * it will be visibly disabled rather than silently inert.
 */
export type SkLinkElement = HTMLElement & {
  href: string
  external: boolean
  subtle: boolean
  target?: string
  rel?: string
  download?: string
}

export type LinkProps = {
  /** The destination. */
  href: string
  /** Marks a link that leaves the application: new tab, safe rel, and an icon. */
  external?: boolean
  /** Suppresses the underline until hover or focus. */
  subtle?: boolean
  /** Opened in a new tab without the external treatment. */
  target?: string
  /** Forwarded to the underlying anchor. */
  rel?: string
  /** Passed through for download links. */
  download?: string
  className?: string
  children?: ReactNode
}

export const Link = forwardRef<SkLinkElement, LinkProps>(function Link(
  { href, external, subtle, target, rel, download, className, children },
  ref,
): ReactElement {
  return (
    <sk-link
      ref={ref}
      class={cn(className)}
      href={href}
      external={external}
      subtle={subtle}
      target={target}
      rel={rel}
      download={download}
    >
      {children}
    </sk-link>
  )
})
