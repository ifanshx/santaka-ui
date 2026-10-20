import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Pagination — Tier 2 navigation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Four decisions, all of them about what a screen reader hears:
 *
 * 1. **`<nav>` with `aria-label`, and the page numbers are links.** Pagination is
 *    navigation, so it is a landmark; the numbers are `<a href>` because a page
 *    is a destination, and a `<button>` would misdescribe it as an action.
 * 2. **The current page carries `aria-current="page"`, and is `aria-disabled`
 *    rather than a dead link.** A link to the page you are on is a no-op that
 *    reads as actionable.
 * 3. **The ellipsis is decorative and hidden.** "…" is not a page. Rendered as
 *    an empty `<span>` with `aria-hidden`, so it is not announced as a stop and
 *    is not focusable.
 * 4. **Prev and Next keep real accessible names.** "‹" alone announces as a
 *    punctuation mark, so each carries a visually hidden word alongside the
 *    glyph.
 *
 * The window is computed here rather than left to the consumer: `count` and
 * `page` are the inputs, and which pages to show with ellipses is the part every
 * consumer reimplements badly.
 *
 * §4's event rule: `sk-page-change` fires only for user-initiated changes, never
 * when `page` is updated programmatically, which is what keeps a controlled
 * pager from looping.
 */
@Component({
  tag: "sk-pagination",
  scoped: true,
  shadow: false,
})
export class SkPagination {
  /** The custom element itself. Public so the change event can be dispatched. */
  @Element() host!: HTMLElement

  /** Total number of pages. */
  @Prop({ reflect: true }) count = 1

  /** The current page, 1-based. */
  @Prop({ reflect: true, mutable: true }) page = 1

  /**
   * How many page numbers to show between the ellipses. Small enough that the
   * row never wraps on a 320px viewport.
   */
  @Prop({ reflect: true }) siblings = 1

  /** Accessible name for the landmark. */
  @Prop() label = "Pagination"

  /** Builds the href for a page number. `$p` is replaced with the page. */
  @Prop() href = ""
  /**
   * Fired when the reader picks a page, with `{ page }` in `detail`.
   *
   * Dispatched manually rather than through `@Event()`: Stencil's decorator
   * leaks its internal `EventEmitter` type into the public `.d.ts`, which breaks
   * package validation (attw, InternalResolutionError). Every other component
   * event in this library dispatches a `CustomEvent` the same way.
   */
  private emitChange(page: number) {
    this.host.dispatchEvent(
      new CustomEvent("sk-page-change", { detail: { page }, bubbles: true, composed: true }),
    )
  }

  /**
   * The visible page numbers, with `null` marking an ellipsis.
   *
   * First and last are always shown, so the row always tells you how far the
   * range extends; the window around the current page is what moves.
   */
  private get slots(): Array<number | null> {
    const total = Math.max(1, this.count)
    const current = Math.min(Math.max(1, this.page), total)
    // The window is the current page plus `siblings` on each side, plus the
    // always-shown first and last — so the total never exceeds siblings*2 + 5.
    const window = new Set<number>([1, total])
    for (let p = current - this.siblings; p <= current + this.siblings; p++) {
      if (p >= 1 && p <= total) window.add(p)
    }
    const pages = [...window].sort((a, b) => a - b)

    const out: Array<number | null> = []
    let previous = 0
    for (const p of pages) {
      if (previous && p - previous > 1) out.push(null)
      out.push(p)
      previous = p
    }
    return out
  }

  private hrefFor(page: number): string | undefined {
    return this.href ? this.href.replace("$p", String(page)) : undefined
  }

  private go(page: number, event: Event) {
    // A link with an href is left to the browser; this only handles the
    // href-less case, where the component is the navigation.
    if (this.href) return
    event.preventDefault()

    const total = Math.max(1, this.count)
    const next = Math.min(Math.max(1, page), total)
    if (next === this.page) return

    this.page = next
    // Fired for a user action only — a prop update never emits, per §4.
    this.emitChange(next)
  }

  render() {
    const total = Math.max(1, this.count)
    const current = Math.min(Math.max(1, this.page), total)
    // Bound, not just referenced: `const href = this.hrefFor` would call the
    // method with `this` undefined, which threw inside render and left the
    // element upgraded but empty — a failure the markup alone cannot show.
    const href = this.hrefFor.bind(this)
    const go = this.go.bind(this)

    return (
      <Host data-slot="pagination" data-count={total}>
        <nav class="sk-pagination__nav" data-slot="nav" aria-label={this.label}>
          <ol class="sk-pagination__list" data-slot="list">
            <li class="sk-pagination__item" data-slot="item">
              {current <= 1 ? (
                <span class="sk-pagination__step" data-slot="step" aria-disabled="true">
                  <span aria-hidden="true">‹</span>
                  <span class="sk-visually-hidden">Previous page</span>
                </span>
              ) : (
                <a
                  class="sk-pagination__step"
                  data-slot="step"
                  href={href(current - 1)}
                  onClick={(event) => go(current - 1, event)}
                >
                  <span aria-hidden="true">‹</span>
                  <span class="sk-visually-hidden">Previous page</span>
                </a>
              )}
            </li>

            {this.slots.map((slot) =>
              slot === null ? (
                <li class="sk-pagination__item" data-slot="item">
                  {/*
                    Decorative: "…" is not a page, so it is empty, hidden, and
                    carries no link or button.
                  */}
                  <span class="sk-pagination__ellipsis" data-slot="ellipsis" aria-hidden="true" />
                </li>
              ) : (
                <li class="sk-pagination__item" data-slot="item">
                  {slot === current ? (
                    <span
                      class="sk-pagination__page"
                      data-slot="page"
                      aria-current="page"
                      aria-disabled="true"
                    >
                      <span aria-hidden="true">{slot}</span>
                      <span class="sk-visually-hidden">Page {slot}, current page</span>
                    </span>
                  ) : (
                    <a
                      class="sk-pagination__page"
                      data-slot="page"
                      href={href(slot)}
                      onClick={(event) => go(slot, event)}
                    >
                      <span aria-hidden="true">{slot}</span>
                      <span class="sk-visually-hidden">Page {slot}</span>
                    </a>
                  )}
                </li>
              ),
            )}

            <li class="sk-pagination__item" data-slot="item">
              {current >= total ? (
                <span class="sk-pagination__step" data-slot="step" aria-disabled="true">
                  <span aria-hidden="true">›</span>
                  <span class="sk-visually-hidden">Next page</span>
                </span>
              ) : (
                <a
                  class="sk-pagination__step"
                  data-slot="step"
                  href={href(current + 1)}
                  onClick={(event) => go(current + 1, event)}
                >
                  <span aria-hidden="true">›</span>
                  <span class="sk-visually-hidden">Next page</span>
                </a>
              )}
            </li>
          </ol>
        </nav>
      </Host>
    )
  }
}
