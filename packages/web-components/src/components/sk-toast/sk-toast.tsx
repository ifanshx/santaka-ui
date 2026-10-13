import { Component, Element, h, Host, Prop, State, Watch } from "@stencil/core"
import { emitOpenChange, type DialogState } from "../shared/dialog-base.js"

/** Handle for the auto-dismiss clock, named so consumers of the state need not
 * couple to `setTimeout`'s return shape. */
type TimerHandle = ReturnType<typeof setTimeout>

/**
 * Toast — Tier 2, non-blocking glass.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A toast is the opposite of a dialog and the opposite of a Skeleton, in the
 * same way those two are opposites of each other. A dialog interrupts; a toast
 * must not. A skeleton hides from the accessibility tree; a toast must be
 * announced — its whole job is to tell the user something happened while they
 * were looking somewhere else.
 *
 * So: `role="status"` (a polite live region), not `alert`. The message is
 * announced when it appears and never re-announced; a toast that shouts is a
 * dialog wearing a smaller skirt. Duration is the consumer's decision, with a
 * pause on hover and on focus — a live region that disappears mid-read is an
 * announcement that never happened.
 *
 * Unlike the dialogs, the toast renders its own panel inline (no native
 * `<dialog>`, no focus capture — it never takes focus at all) and stacks via
 * the `--sk-z-toast` layer. Placement is the *page's* concern: the consumer
 * positions a region and drops toasts into it, which is why this component is
 * a single toast and not a toaster.
 */
@Component({
  tag: "sk-toast",
  scoped: true,
  shadow: false,
})
export class SkToast {
  @Element() host!: HTMLElement

  /** Whether the toast is showing. */
  @Prop({ mutable: true, reflect: true }) open = false

  /**
   * Milliseconds before auto-dismiss. `0` never auto-dismisses — for an error
   * the user must act on, an expiring message is an expired apology.
   */
  @Prop() duration = 5000

  /** Visual severity, matching Badge's palette. Color is never the message. */
  @Prop({ reflect: true }) variant: "neutral" | "success" | "warning" | "danger" = "neutral"

  @State() private state!: DialogState
  @State() private timer: TimerHandle | null = null
  @State() private paused = false

  componentWillLoad() {
    // The panel is a plain div wearing glass — a toast never takes focus, so
    // the native dialog element's machinery (trapping, backdrop) would be
    // wrong here rather than merely unused.
    const panel = document.createElement("div")
    panel.className = "sk-glass sk-toast__panel"
    panel.setAttribute("data-slot", "panel")
    panel.setAttribute("role", "status")
    panel.setAttribute("data-variant", this.variant)
    const body = document.createElement("slot")
    panel.appendChild(body)
    const close = document.createElement("button")
    close.type = "button"
    close.className = "sk-toast__close"
    close.setAttribute("data-slot", "close")
    close.setAttribute("aria-label", "Dismiss notification")
    close.textContent = "×"
    panel.appendChild(close)
    this.host.appendChild(panel)
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
    if (this.open) this.startTimer()
  }

  disconnectedCallback() {
    this.clearTimer()
  }

  @Watch("open")
  openChanged(next: boolean) {
    this.state.open = next
    if (next) {
      this.startTimer()
      // Live-region announcement happens on insertion into the tree; the
      // panel's role=status carries it. Re-showing an old toast re-announces,
      // which is correct: the user asked to see it again.
    } else {
      this.clearTimer()
    }
  }

  private startTimer() {
    this.clearTimer()
    if (this.duration === 0) return
    this.timer = setTimeout(() => {
      this.open = false
      emitOpenChange(this.state, false)
    }, this.duration)
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /** Hover or focus pauses the clock; leaving resumes what remained. */
  private handlePause(event: Event, entering: boolean) {
    if (this.duration === 0 || !this.open) return
    if (entering) {
      this.paused = true
      if (this.timer !== null) {
        clearTimeout(this.timer)
        this.timer = null
      }
    } else if (this.paused) {
      this.paused = false
      this.startTimer()
    }
  }

  private dismiss() {
    this.open = false
    emitOpenChange(this.state, false)
  }

  private handlePanelClick(event: Event) {
    const target = event.target as Element | null
    if (target?.closest("[data-slot='close']")) this.dismiss()
  }

  render() {
    return (
      <Host
        data-slot="toast"
        data-state={this.open ? "open" : "closed"}
        onClick={(e: Event) => this.handlePanelClick(e)}
        onMouseEnter={(e: Event) => this.handlePause(e, true)}
        onMouseLeave={(e: Event) => this.handlePause(e, false)}
        onFocusin={(e: Event) => this.handlePause(e, true)}
        onFocusout={(e: Event) => this.handlePause(e, false)}
      />
    )
  }
}
