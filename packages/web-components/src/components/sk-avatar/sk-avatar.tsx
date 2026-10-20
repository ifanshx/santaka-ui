import { Component, h, Host, Prop, State, Watch } from "@stencil/core"

/**
 * Avatar — Tier 1 display component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * An avatar is a picture of a person, and that makes it *meaningful* rather
 * than decorative. A decorative image takes `alt=""`; this one is the person's
 * name as far as a screen-reader user is concerned. That framing decides three
 * things this component does deliberately:
 *
 * 1. **The host is the accessible image, not the `<img>`.** `role="img"` with
 *    the person's name as its label, and the `<img>` inside is `alt=""`. The
 *    alternative — putting the name on the `<img>` — leaves the initials span
 *    as a second, competing text node in the same box.
 * 2. **An avatar with no name and no image carries no information**, so it gets
 *    `aria-hidden` instead of an empty `role="img"`. An unnamed image is an axe
 *    violation (`role-img-alt`), and the tempting fix — defaulting the label to
 *    something like "avatar" — is worse: it announces a word the designer
 *    wrote, not the person's name.
 * 3. **`data-state` distinguishes why initials are showing.** "No image",
 *    "still loading", and "the image 404'd" look identical in review and are
 *    three different bugs. The attribute names which, so a screenshot diff and
 *    a test can both tell them apart.
 *
 * The initials are derived from `name`, never supplied separately. Two fields
 * that can disagree are how an avatar shows "JD" while announcing "Jane Doe".
 *
 * The shape is a circle, which is a deliberate departure: chrome in this system
 * is hard-edged at zero radius (ADR-017), but a portrait is not chrome. A
 * square with no radius reads as a cropped document rather than a person.
 */
@Component({
  tag: "sk-avatar",
  scoped: true,
  shadow: false,
})
export class SkAvatar {
  /**
   * The person's name. It is the accessible name of the image and the source of
   * the initials — one field, so the two cannot disagree.
   */
  @Prop() name = ""

  /** Image source. Without it, the initials render. */
  @Prop() src = ""

  /** Diameter. An avatar is square by ratio, so `size` is one axis. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /**
   * Why the initials are showing, when they are.
   *
   * `absent` and `error` render the same pixels, which is exactly the problem:
   * one is a consumer who passed no `src`, the other is a broken URL. Keeping
   * them as one state would make a screenshot diff unable to tell a missing
   * image from a failed one.
   */
  @State() private status: "absent" | "loading" | "loaded" | "error" = "absent"

  @Watch("src")
  onSrcChange() {
    // A changed `src` starts over; the browser will not re-fire `load` for an
    // image that is already in cache, so the status has to be reset here or a
    // second src would leave the first one's state on the host.
    this.status = this.src ? "loading" : "absent"
  }

  componentWillLoad() {
    this.status = this.src ? "loading" : "absent"
  }

  render() {
    const initials = initialsFrom(this.name)
    // The name, or the initials when there is no name. Empty only when the
    // consumer supplied neither — and that is the one case that gets hidden
    // rather than labelled with a word nobody wrote.
    const label = this.name.trim() || initials
    const showingImage = this.status === "loaded" || this.status === "loading"

    return (
      <Host
        data-slot="avatar"
        data-size={this.size}
        data-state={this.status}
        {...(label
          ? { role: "img", "aria-label": label }
          : { "aria-hidden": "true", role: "presentation" })}
      >
        <span class="sk-avatar__frame" data-slot="frame">
          {this.src ? (
            <img
              class="sk-avatar__image"
              data-slot="image"
              src={this.src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              onLoad={() => (this.status = "loaded")}
              onError={() => (this.status = "error")}
            />
          ) : null}
          {/*
            The initials render under the image rather than instead of it, so a
            slow or failed image reveals them instead of leaving a hole. They
            are hidden from assistive technology because the host already
            carries the name — two announcements of one person is not better
            than one.
          */}
          <span
            class="sk-avatar__initials"
            data-slot="initials"
            aria-hidden="true"
            data-visible={showingImage ? "false" : "true"}
          >
            {initials}
          </span>
        </span>
      </Host>
    )
  }
}

/**
 * Initials from a display name: first and last word, one character each.
 *
 * Deliberately naive about honorifics and particles. A smarter parser is a
 * localization decision this component has no business making — section 6 says
 * locale is consumer-supplied, and name order, particles, and single-name
 * cultures are all locale questions. The fallback is the first character, so a
 * single-word name still shows something.
 */
function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0]!.slice(0, 1).toUpperCase()
  return `${words[0]!.slice(0, 1)}${words[words.length - 1]!.slice(0, 1)}`.toUpperCase()
}
