import { Component, h, Host, Prop } from "@stencil/core"

/**
 * Taka — the project's optional mascot (§1.8, §13).
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Three rules govern this component, and they come straight from the plan:
 *
 * 1. **The artwork is original.** §13: "treat the 'Taka' mascot as original
 *    artwork committed under the project license. Any traced or borrowed asset
 *    invalidates the icon/illustration license story." This is drawn here as
 *    paths and primitives — no imported asset, nothing traced.
 * 2. **It is decorative, always.** A mascot is never the only carrier of
 *    meaning, so it renders `aria-hidden` and takes no role. The heading beside
 *    it does the talking; the bird is what makes the empty state feel less like
 *    a failure.
 * 3. **It is reserved for onboarding, empty states, and easter eggs** — §1.8
 *    says "rather than every screen". `mood` exists so the same character reads
 *    differently in each of those places without becoming a second mascot.
 *
 * `mood` also has to respect reduced motion: `wave` and `bounce` are idle
 * animations, and §6 requires `prefers-reduced-motion` to remove them rather
 * than shorten them. That is handled in the stylesheet, not here.
 */
@Component({
  tag: "sk-taka",
  scoped: true,
  shadow: false,
})
export class SkTaka {
  /**
   * What Taka is doing. `idle` is a still portrait; the other two add an idle
   * animation that reduced motion removes entirely.
   */
  @Prop({ reflect: true }) mood: "idle" | "wave" | "bounce" = "idle"

  /** Rendered size, in the icon scale. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  render() {
    return (
      <Host data-slot="taka" data-mood={this.mood} data-size={this.size} aria-hidden="true">
        <svg
          class="sk-taka__art"
          viewBox="0 0 64 64"
          role="presentation"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body: one rounded solid, hard-edged where the system is hard-edged. */}
          <path
            class="sk-taka__body"
            d="M14 34c0-9 7-16 18-16s18 7 18 16c0 10-7 18-18 18s-18-8-18-18Z"
          />
          {/* Belly: the lighter front, carrying the fill token. */}
          <path
            class="sk-taka__belly"
            d="M20 36c0-6 5-10 12-10s12 4 12 10-5 12-12 12-12-6-12-12Z"
          />
          {/* Beak: a triangle, drawn rather than traced. */}
          <path class="sk-taka__beak" d="M40 24l10 4-10 4Z" />
          {/* Eye: a filled dot plus a highlight, both primitives. */}
          <circle class="sk-taka__eye" cx="34" cy="24" r="3" />
          <circle class="sk-taka__highlight" cx="35" cy="23" r="1" />
          {/* Crest: three strokes, the only thing that waves. */}
          <g class="sk-taka__crest">
            <path d="M26 16l-2-6" />
            <path d="M31 15l0-7" />
            <path d="M36 16l2-6" />
          </g>
          {/* Feet: two strokes, the only thing that bounces. */}
          <g class="sk-taka__feet">
            <path d="M26 52v4" />
            <path d="M38 52v4" />
          </g>
        </svg>
      </Host>
    )
  }
}
