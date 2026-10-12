// Registers every custom element eagerly, as `@santaka-ui/web-components`
// documents (ADR-001, eager registration path).
import "/packages/web-components/dist/components/index.js"

const form = document.querySelector("#probe")
const result = document.querySelector("#result")
const log = document.querySelector("#log")

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
