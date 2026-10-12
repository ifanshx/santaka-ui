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

// Prove the click path reaches the page: a disabled or loading element must
// not produce an activation here.
document.addEventListener("click", (event) => {
  const target = event.target
  if (target instanceof HTMLElement && target.matches("sk-button")) {
    log.textContent = `clicked: ${target.getAttribute("variant") ?? "primary"}`
  }
})
