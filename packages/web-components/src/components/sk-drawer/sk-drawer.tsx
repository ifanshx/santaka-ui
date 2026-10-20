import { Component, Element, h, Host, Listen, Method, Prop, Watch } from "@stencil/core"
import {
  createDialogPanel,
  emitOpenChange,
  handleDialogClick,
  hideDialog,
  initTriggerState,
  moveChildrenIntoPanel,
  showDialog,
  type DialogState,
} from "../shared/dialog-base.js"

/**
 * Drawer — Tier 2 floating overlay that slides in from one edge.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * A drawer is a dialog with a different shape, and the codebase already decided
 * how dialogs work — so this reuses `shared/dialog-base.ts` rather than writing
 * a second focus story. That is the whole point of the base existing. The
 * browser owns focus trapping, Escape, `::backdrop`, and inert background
 * content; nothing here reimplements them.
 *
 * What is genuinely ours is the edge, and it is the part worth being careful
 * about:
 *
 * - **`side` is logical, not physical.** `start` and `end`, never `left` and
 *   `right`: a document with `dir="rtl"` gets the mirrored edge for free, which
 *   is ADR-016's requirement rather than a preference. There is deliberately no
 *   physical pair — a fixed edge is exactly what puts a drawer on the wrong side
 *   of a right-to-left document.
 * - **The entrance is the glass material's float**, not the control's press
 *   (§2 splits motion by layer). Reduced motion removes it rather than
 *   shortening it.
 *
 * Like the dialog, open/closed is ephemeral state the component owns outright,
 * so there is no `defaultOpen` — §4's rule for state the caller cannot see.
 * Every close path reports through one `sk-open-change`.
 */
@Component({
  tag: "sk-drawer",
  scoped: true,
  shadow: false,
})
export class SkDrawer {
  @Element() host!: HTMLElement

  /** Whether the drawer is showing. Reflects so page CSS can target it. */
  @Prop({ mutable: true, reflect: true }) open = false

  /**
   * Which edge it slides from.
   *
   * Both values are logical and mirror under `dir="rtl"`, which is ADR-016's
   * requirement. There is no physical pair — see the note at the top of the
   * stylesheet for why.
   */
  @Prop({ reflect: true }) side: "start" | "end" = "end"

  /**
   * Modal is the default: the page behind is inert and focus is trapped. A
   * non-modal drawer is for a persistent side panel the reader keeps open while
   * working.
   */
  @Prop({ reflect: true }) modal = true

  /** Closes when the backdrop is clicked. */
  @Prop({ reflect: true }) dismissible = true

  /** Accessible name for the panel. The consumer's title slot supplies it best. */
  @Prop() label = ""

  private state: DialogState | null = null

  @Watch("open")
  onOpenChange() {
    if (!this.state) return
    this.state.open = this.open
    if (this.open) showDialog(this.state)
    else hideDialog(this.state)
  }

  componentWillLoad() {
    this.state = {
      host: this.host,
      dialog: null,
      open: this.open,
      modal: this.modal,
      dismissible: this.dismissible,
      returnFocusTo: null,
    }
  }

  componentDidLoad() {
    if (!this.state) return
    // The panel is created imperatively, like the dialog's: a native <dialog>
    // must exist before showModal() and cannot be part of a Stencil render
    // without fighting the slot distribution the base performs.
    this.state.dialog = createDialogPanel(this.host, "dialog")
    this.state.dialog.classList.add("sk-drawer__panel")
    if (this.label) this.state.dialog.setAttribute("aria-label", this.label)
    moveChildrenIntoPanel(this.host, this.state.dialog)
    // The trigger announces its state from the first paint, not from the
    // first open — an invoker that gains `aria-expanded` only mid-session
    // reads as broken to a screen reader parked on it.
    initTriggerState(this.state)
    if (this.open) showDialog(this.state)
  }

  disconnectedCallback() {
    // A removed drawer must not leave the page inert: hideModal() is what
    // releases the backdrop and returns focus.
    if (this.state?.dialog?.open) hideDialog(this.state)
  }
  @Listen("click")
  onClick(event: MouseEvent) {
    if (!this.state) return
    // The third argument writes through the component's prop, not the state
    // snapshot — the base records why: a base that writes the snapshot writes
    // somewhere the @Watch never sees, so the DOM methods never run.
    handleDialogClick(this.state, event, (open) => {
      this.open = open
    })
  }

  /** Opens the drawer. Equivalent to setting `open`. */
  @Method()
  async show() {
    if (!this.state) return
    this.open = true
    showDialog(this.state)
  }

  /** Closes the drawer. */
  @Method()
  async close() {
    if (!this.state) return
    this.open = false
    hideDialog(this.state)
  }

  private onDialogClose = () => {
    if (!this.state) return
    this.open = false
    emitOpenChange(this.state, false)
  }

  render() {
    return (
      <Host
        data-slot="drawer"
        data-side={this.side}
        data-open={this.open ? "" : undefined}
        // The native close fires for Escape and every path the browser owns, so
        // this is what keeps the prop, the attribute, and the event in step.
        {...{ onClose: this.onDialogClose }}
      >
        <slot name="trigger" />
      </Host>
    )
  }
}
