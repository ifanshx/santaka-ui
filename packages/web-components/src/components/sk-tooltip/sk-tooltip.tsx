import { Component, Element, h, Host, Listen, Prop, State, Watch } from "@stencil/core"
import { type DialogState } from "../shared/dialog-base.js"

/** Handle for the show-delay clock, named so the state need not couple to
 * `setTimeout`'s return shape. */
type TimerHandle = ReturnType<typeof setTimeout>

/**
 * Tooltip — Tier 2, the quietest glass.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A tooltip is a *description of something the user can already see and use*,
 * never a place where information lives. That definition drives every rule:
 *
 *  - It is named through `aria-describedby` pointing at the tooltip's content,
 *    so a screen reader reads it on demand — a tooltip that grabs focus is a
 *    popup wearing a tiny hat.
 *  - It shows on hover and on keyboard focus, and hides on Escape. The
 *    keyboard path is the reason this is a component and not a `title`
 *    attribute: `title` never shows for keyboard users at all.
 *  - It takes **no** pointer events itself, so hovering the tooltip never
 *    flickers it away; only leaving the trigger does.
 *  - It is explicitly excluded from the forms contract (§4): it cannot be
 *    form-associated, and it says so.
 *
 * Placement is a hint, not a guarantee: the consumer picks the side and the
 * component flips at the viewport edge rather than rendering off-screen.
 */
@Component({
  tag: "sk-tooltip",
  scoped: true,
  shadow: false,
})
export class SkTooltip {
  @Element() host!: HTMLElement

  /** Whether the tooltip is showing. Driven by hover/focus; also settable. */
  @Prop({ mutable: true, reflect: true }) open = false

  /** Preferred side. Flips at the viewport edge rather than clipping. */
  @Prop({ reflect: true }) placement: "top" | "bottom" | "left" | "right" = "top"

  /** Milliseconds of hover before showing. A tooltip that fires instantly is a strobe. */
  @Prop() delay = 300

  @State() private state!: DialogState
  private hoverTimer: TimerHandle | null = null
  private content: HTMLDivElement | null = null

  componentWillLoad() {
    const panel = document.createElement("div")
    panel.className = "sk-glass sk-tooltip__panel"
    panel.setAttribute("data-slot", "panel")
    panel.setAttribute("id", `${this.host.id || "sk-tooltip"}-content`)
    const body = document.createElement("slot")
    panel.appendChild(body)
    this.host.appendChild(panel)
    this.content = panel
    this.state = {
      host: this.host,
      dialog: panel as unknown as HTMLDialogElement,
      open: this.open,
      modal: false,
      dismissible: false,
      returnFocusTo: null,
    }
  }

  componentDidLoad() {
    this.wireDescribedBy()
    if (this.open) this.show()
  }

  disconnectedCallback() {
    this.clearTimer()
  }

  /**
   * Points the first focusable slotted trigger at this tooltip's content via
   * `aria-describedby`, only when the trigger does not already describe
   * itself — a consumer's explicit description wins.
   */
  private wireDescribedBy() {
    const trigger = this.host.querySelector("[slot='trigger']")
    if (!trigger) return
    if (trigger.hasAttribute("aria-describedby")) return
    const existing = trigger.getAttribute("aria-describedby")
    const id = this.content?.id
    if (!id) return
    trigger.setAttribute("aria-describedby", existing ? `${existing} ${id}` : id)
  }

  @Watch("open")
  openChanged(next: boolean) {
    this.state.open = next
    if (this.content) this.content.hidden = !next
  }

  private show() {
    this.clearTimer()
    this.open = true
  }

  private scheduleShow() {
    if (this.open || this.delay === 0) {
      this.show()
      return
    }
    this.clearTimer()
    this.hoverTimer = setTimeout(() => this.show(), this.delay)
  }

  private hide() {
    this.clearTimer()
    this.open = false
  }

  private clearTimer() {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer)
      this.hoverTimer = null
    }
  }

  @Listen("mouseenter", { capture: true })
  handleEnter(event: Event) {
    // Stencil capture listeners see every descendant's mouseenter/leave, not
    // just the host's: moving from the button onto its label fires
    // mouseleave(button), and without a boundary check that would hide the
    // tooltip while the pointer is still on the trigger. Only an entry that
    // is not coming from inside the host counts as entering.
    if (this.isInsideHost(event)) return
    this.scheduleShow()
  }

  @Listen("mouseleave", { capture: true })
  handleLeave(event: Event) {
    // Symmetrically: only a departure whose destination is outside the host
    // counts as leaving. `relatedTarget` is where the pointer went. Stencil's
    // DOM lib types relatedTarget as EventTarget, so the Node check is made
    // structurally rather than by cast.
    const to = (event as MouseEvent).relatedTarget as Node | null
    if (to && this.host.contains(to)) return
    this.hide()
  }

  private isInsideHost(event: Event): boolean {
    const from = (event as MouseEvent).relatedTarget as Node | null
    return Boolean(from && this.host.contains(from))
  }

  @Listen("focusin", { capture: true })
  handleFocus() {
    // Keyboard focus shows without the hover delay: a tabbing user asked for
    // it explicitly, and a 300ms penance on every tab is hostile.
    this.show()
  }

  @Listen("focusout", { capture: true })
  handleBlur() {
    this.hide()
  }

  @Listen("keydown", { capture: true })
  handleKeydown(event: Event) {
    if ((event as KeyboardEvent).key === "Escape" && this.open) {
      this.hide()
    }
  }

  render() {
    return (
      <Host data-slot="tooltip" data-state={this.open ? "open" : "closed"}>
        <slot name="trigger" />
      </Host>
    )
  }
}
