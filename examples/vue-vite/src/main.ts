import { createApp } from "vue"

// Order matters and mirrors the documented consumer path (packages/vue README):
// tokens first, then the component stylesheet, then the app's own CSS.
import "@santaka-ui/tokens/css/index.css"
import "@santaka-ui/web-components/santaka.css"
import "@santaka-ui/styles/index.css"

import "./define-elements.js"
import App from "./App.vue"

createApp(App).mount("#app")
