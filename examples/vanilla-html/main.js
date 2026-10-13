// Registers every custom element eagerly, as `@santaka-ui/web-components`
// documents (ADR-001, eager registration path).
import "/packages/web-components/dist/components/index.js"

const form = document.querySelector("#probe")
const result = document.querySelector("#result")
const log = document.querySelector("#log")

// The Dialog owns its trigger: a click on any slotted [slot=trigger] opens it,
// Escape and backdrop dismissal close it, and sk-open-change reports both. The
// page only reacts to the outcome.
const dialog = document.querySelector("#example-dialog")
const dialogResult = document.querySelector("#dialog-result")
dialog?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return
  if (event.target.closest("#dialog-confirm")) {
    dialog.open = false
    if (dialogResult) dialogResult.textContent = "draft discarded"
  }
  if (event.target.closest("#dialog-cancel")) {
    dialog.open = false
    if (dialogResult) dialogResult.textContent = "kept editing"
  }
})
dialog?.addEventListener("sk-open-change", (event) => {
  if (!(event instanceof CustomEvent)) return
  if (event.detail.open === false && dialogResult && !dialogResult.textContent) {
    // Escape and backdrop both land here; the copy distinguishes nothing, by
    // design: the user's work was not lost, so the message stays neutral.
    dialogResult.textContent = "dialog dismissed"
  }
})

form?.addEventListener("submit", (event) => {
  event.preventDefault()
  result.textContent = `submitted at ${new Date().toISOString().slice(11, 19)}`
})

// Prove the click path reaches the page: a disabled or loading element must not
// produce an activation here.
//
// `closest` rather than `matches`: a click on an icon inside an icon button
// reports the `<svg>` as its target, so matching the target directly would miss
// every activation that lands on the slotted content.
document.addEventListener("click", (event) => {
  const target = event.target
  if (!(target instanceof Element)) return

  const control = target.closest("sk-button, sk-icon-button")
  if (!control) return
  if (control.getAttribute("data-disabled") !== null) return
  if (control.getAttribute("data-loading") !== null) return

  log.textContent = `clicked: ${control.getAttribute("variant") ?? "default"}`
})
