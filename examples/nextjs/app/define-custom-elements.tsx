"use client"

import { useEffect } from "react"
import { defineCustomElements } from "@santaka-ui/web-components/loader"

/**
 * The lazy-registration path (ADR-005): the server renders the custom element
 * tags as inert HTML, and this client-only component defines the elements
 * after hydration. Calling it in an effect — not at module scope — keeps the
 * definition off the server bundle entirely, which is the load-bearing part
 * of the two-path decision.
 */
export function DefineCustomElements() {
  useEffect(() => {
    void defineCustomElements(window)
  }, [])
  return null
}
