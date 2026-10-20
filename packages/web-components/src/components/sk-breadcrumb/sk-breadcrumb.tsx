import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Breadcrumb — Tier 2 navigation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The ARIA shape is the whole reason this is a component rather than a row of
 * links:
 *
 * 1. **`<nav>` with `aria-label="Breadcrumb"`, and an `<ol>` inside.** The nav
 *    makes it a landmark a screen reader can jump to; the list is what makes it
 *    announce "list, 3 items" so the reader knows there is a hierarchy rather
 *    than three unrelated links.
 * 2. **The current page is `aria-current="page"`, not a link.** A link to the
 *    page you are already on is a no-op that reads as actionable. Marking it is
 *    what distinguishes "where you are" from "where you came from".
 * 3. **The separators are decorative and hidden.** Drawn in CSS with
 *    `aria-hidden`, so a reader does not announce "slash, slash, slash" between
 *    the items. A `<span>/</span>` between every item is the common mistake.
 *
 * The items come from an `items` array rather than slotted children, because the
 * component has to know which one is last — that is what `aria-current` hangs
 * off, and a slot cannot tell you how many nodes it received without walking
 * them at runtime.
 */
@Component({
  tag: "sk-breadcrumb",
  scoped: true,
  shadow: false,
})
export class SkBreadcrumb {
  /**
   * The trail, oldest first — the last entry is the current page.
   *
   * A JSON array of `{ label, href? }`. `href` is optional precisely because the
   * last item normally has none: the current page is not a link.
   */
  @Prop() items: string | Array<{ label: string; href?: string }> = "[]"

  /** Accessible name for the landmark. Defaults to "Breadcrumb". */
  @Prop() label = "Breadcrumb"

  private parsed(): Array<{ label: string; href?: string }> {
    if (Array.isArray(this.items)) return this.items
    try {
      const parsed: unknown = JSON.parse(this.items || "[]")
      return Array.isArray(parsed) ? (parsed as Array<{ label: string; href?: string }>) : []
    } catch {
      // Malformed JSON is a consumer error, not a crash: an empty trail renders
      // no list rather than throwing inside a render.
      return []
    }
  }

  render() {
    const items = this.parsed()
    if (items.length === 0) return <Host data-slot="breadcrumb" hidden />

    return (
      <Host data-slot="breadcrumb">
        <nav class="sk-breadcrumb__nav" data-slot="nav" aria-label={this.label}>
          <ol class="sk-breadcrumb__list" data-slot="list">
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              return (
                <li class="sk-breadcrumb__item" data-slot="item">
                  {/*
                    The separator is drawn, not typed: `::before` in the
                    stylesheet, on every item after the first. It carries no
                    text, so nothing is announced between the items.
                  */}
                  {isLast || !item.href ? (
                    <span
                      class="sk-breadcrumb__current"
                      data-slot="current"
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <a class="sk-breadcrumb__link" data-slot="link" href={item.href}>
                      {item.label}
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </Host>
    )
  }
}
