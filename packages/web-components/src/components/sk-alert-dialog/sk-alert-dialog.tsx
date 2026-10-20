import { Component, Element, h, Host, Listen, Prop, State, Watch } from "@stencil/core"
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
 * Alert Dialog — Tier 2, and the reason the dialog mechanics were extracted
 * rather than copied.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * An alert dialog is a dialog that asks a question the page cannot continue
 * without: the decision is forced, and interruption is the *point*. Three
 * properties follow from that definition, and each one is a removal from
 * `sk-dialog`:
 *
 *  - `role="alertdialog"`, so assistive technology announces it as an
 *    interruption rather than as a window.
 *  - **No dismissal**: no `dismissible` prop, no backdrop click, and Escape is
 *    refused. A user cannot decline to answer — they must choose an action.
 *    This is the ARIA APG's requirement for the role, not a style choice.
 *  - **No trigger slot.** An alert is raised by the application in response to
 *    something, never opened by the user browsing; a "click to see the
 *    warning" control is a contradiction.
 *
 * Focus goes to the **first action button**, not the first focusable — the
 * decision's default belongs to the consumer, and `initialFocus` lets them
 * pick it explicitly.
 */
@Component({
  tag: "sk-alert-dialog",
  scoped: true,
  shadow: false,
})
export class SkAlertDialog {
  @Element() host!: HTMLElement

  /** Whether the alert is showing. */
  @Prop({ mutable: true, reflect: true }) open = false

  /**
   * Accessible name. Required in spirit: an interruption that announces
   * nothing is a modal mystery. Prefer a real heading in the `title` slot.
   */
  @Prop() label = ""

  /**
   * Selector or element id for the control that receives initial focus — the
   * action the consumer wants to be the default. Falls back to the first
   * button in the panel.
   */
  @Prop() initialFocus = ""

  @State() private state!: DialogState

  componentWillLoad() {
    const dialog = createDialogPanel(this.host, "alertdialog")
    this.state = {
      host: this.host,
      dialog,
      open: this.open,
      modal: true,
      dismissible: false,
      returnFocusTo: null,
    }
  }

  componentDidLoad() {
    moveChildrenIntoPanel(this.host, this.state.dialog!)
    // The trigger reports state from first paint, not only after the first open:
    // an invoker that gains `aria-expanded` mid-session is a control a screen
    // reader announces differently before and after its first use.
    initTriggerState(this.state)
    if (this.open) showDialog(this.state)
  }

  disconnectedCallback() {
    this.state.dialog?.close()
  }

  @Watch("open")
  openChanged(next: boolean) {
    this.state.open = next
    if (next) {
      showDialog(this.state)
      this.applyInitialFocus()
    } else {
      hideDialog(this.state)
    }
  }

  private applyInitialFocus() {
    const dialog = this.state.dialog
    if (!dialog) return
    const bySelector = this.initialFocus
      ? dialog.querySelector<HTMLElement>(this.initialFocus)
      : null
    const firstButton = dialog.querySelector<HTMLElement>("button")
    const target: HTMLElement = bySelector ?? firstButton ?? dialog
    target.focus()
  }

  /** Imperative open, mirroring sk-dialog's API shape. */
  async showAlert() {
    this.open = true
  }

  /** The only way out: an action. There is no close() without a decision. */
  async decide() {
    this.open = false
  }

  @Listen("cancel", { capture: true })
  handleCancel(event: Event) {
    // Escape fires `cancel`. A dialog that lets Escape answer its question did
    // not need to be asked — this refuses, and the event must be prevented so
    // the native close never runs.
    event.preventDefault()
  }

  @Listen("close", { capture: true })
  handleClose() {
    if (this.open) {
      this.open = false
      emitOpenChange(this.state, false)
    }
  }

  @Listen("click", { capture: true })
  handleDelegate(event: Event) {
    this.state.open = this.open
    handleDialogClick(this.state, event, (open) => {
      this.open = open
    })
  }

  render() {
    return <Host data-slot="alert-dialog" data-state={this.open ? "open" : "closed"} />
  }
}
