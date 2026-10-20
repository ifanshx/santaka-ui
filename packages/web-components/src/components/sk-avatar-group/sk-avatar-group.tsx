import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Avatar Group — Tier 1 display component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A stacked row of avatars, with the overflow collapsed into a count. Three
 * decisions make this more than a flex wrapper:
 *
 * 1. **The overflow count is text, not another avatar.** "+3" is not a person,
 *    so rendering it as a fourth circle invites a reader to think it is one —
 *    and it has no name to announce. It is a `<span>` with a real accessible
 *    name built from the count, not an unnamed circle.
 * 2. **The group is a `group`, not a `list`.** These are people, not items to
 *    navigate. A `list` would make a screen reader announce "list, 4 items" and
 *    walk the reader through each one, when the useful information is one
 *    sentence: "Ada Lovelace, Grace Hopper, and 2 others".
 * 3. **Overlap is visual, not structural.** The stack is drawn with a negative
 *    inline margin on every avatar after the first. Nothing is absolutely
 *    positioned, so the group reflows at narrow widths and mirrors in RTL —
 *    `margin-inline-start` is what flips, not a `left` offset.
 *
 * The avatars are slotted `sk-avatar` elements rather than a data array. A
 * `people={[...]}` prop would be a second, competing way to render a person and
 * would put name/initials/label logic in two places — the duplication that made
 * `sk-avatar` derive initials from `name` rather than accept them.
 */
@Component({
  tag: "sk-avatar-group",
  scoped: true,
  shadow: false,
})
export class SkAvatarGroup {
  /** The custom element itself. Public so the render can reach slotted avatars. */
  @Element() host!: HTMLElement

  /**
   * How many avatars to show before collapsing the rest into a count.
   * `0` means show all.
   */
  @Prop({ reflect: true }) max = 3

  /**
   * The accessible name for the group — "Assigned to", "Contributors". A bare
   * `role="group"` with no label is skipped by most screen readers, so the
   * label is what makes the group announce at all.
   */
  @Prop() label = ""

  /** Diameter applied to every avatar in the group. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  render() {
    // Counted from the light DOM rather than tracked through a
    // MutationObserver: the number only has to be right when the group renders,
    // and a consumer adding avatars later re-renders it. An observer would add
    // a subscription per group for a value that changes once.
    const avatars = Array.from(this.host.querySelectorAll("sk-avatar"))
    const overflow = this.max > 0 ? Math.max(0, avatars.length - this.max) : 0

    // The component is the only thing that knows `max`, so it is the only thing
    // that can mark which avatars are past it — CSS cannot count. The attribute
    // is written rather than the nodes removed, so a consumer who raises `max`
    // gets their markup back; `display: none` in the stylesheet takes the hidden
    // ones out of the accessibility tree, which is what stops a screen reader
    // reading four names while the page shows three plus "+1".
    avatars.forEach((avatar, index) => {
      if (this.max > 0 && index >= this.max) {
        avatar.setAttribute("data-overflow-hidden", "")
      } else {
        avatar.removeAttribute("data-overflow-hidden")
      }
    })

    return (
      <Host
        data-slot="avatar-group"
        data-size={this.size}
        {...(this.label ? { role: "group", "aria-label": this.label } : {})}
      >
        <span class="sk-avatar-group__stack" data-slot="stack">
          <slot />
        </span>
        {overflow > 0 ? (
          <span
            class="sk-avatar-group__overflow"
            data-slot="overflow"
            aria-label={`${overflow} more`}
          >
            {`+${overflow}`}
          </span>
        ) : null}
      </Host>
    )
  }
}
