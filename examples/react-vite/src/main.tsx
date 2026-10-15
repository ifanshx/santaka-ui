import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// Order matters and mirrors the documented consumer path (packages/react README):
// tokens first, then the component stylesheet, then the app's own CSS.
import "@santaka-ui/tokens/css/index.css"
import "@santaka-ui/web-components/santaka.css"
import "@santaka-ui/styles/index.css"

import "./define-elements.js"
import { App } from "./App.js"

const container = document.getElementById("root")
if (container === null) throw new Error("#root is missing from index.html")

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
