import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Kbd — Tier 1 display component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * The semantic is the whole reason this exists, and it is why the component
 * does not merely restyle a `<span>`. A keyboard shortcut written as
 * `<span>Ctrl</span>` is two characters to sighted readers and a run of
 * unmarked text to anyone listening: no role, no pronunciation, no way to tell
 * "Shift" the key from "shift" the word. `<kbd>` is the platform's answer, and
 * this component renders one rather than imitating its appearance.
 *
 * Two decisions worth recording:
 *
 * 1. **The element is real, in the light DOM, with no wrapper box.** Scoped
 *    mode renders the `<kbd>` inside the host (ADR-011), so the consumer's
 *    document structure — a `<kbd>` inside a `<p>`, a `<kbd>` inside a menu
 *    item — stays exactly what they wrote. A wrapper `<div>` here would put an
 *    anonymous box between a shortcut and the text describing it.
 * 2. **`size` follows the type scale, not a pixel ladder.** Shortcuts are read
 *    inline with the copy around them, so the only sizing that stays honest is
 *    the one the type tokens already define.
 *
 * `variant` is not used: this component has one look, and §4's two-prop rule is
 * about components that have an axis to vary on. Adding a decorative variant
 * here would be a prop that exists to be unused.
 */
@Component({
  tag: "sk-kbd",
  scoped: true,
  shadow: false,
})
export class SkKbd {
  /** The type step the shortcut is set in. */
  @Prop({ reflect: true }) size: "sm" | "md" = "md"

  render() {
    return (
      <Host data-slot="kbd" data-size={this.size}>
        <kbd class="sk-kbd__key">
          <slot />
        </kbd>
      </Host>
    )
  }
}
