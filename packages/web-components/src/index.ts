/**
 * Universal Web Components entrypoint.
 *
 * Importing this module registers every custom element. That is the documented
 * default behavior for `@santaka-ui/web-components`: the eager path for plain
 * HTML, React, Vue, Svelte, and Angular, where the tag is known at build time.
 *
 * Registration comes from the `customElementsExportBehavior` setting in
 * `stencil.config.ts`, not from a side effect in this file.
 *
 * SSR frameworks that render the tag during a server pass should instead
 * import `@santaka-ui/web-components/loader` and call
 * `defineCustomElements(window)` from client code (ADR-005), which keeps
 * hydration from upgrading tags the server already produced.
 */
export { SkAlertDialog } from "./components/sk-alert-dialog/sk-alert-dialog.js"
export { SkBadge } from "./components/sk-badge/sk-badge.js"
export { SkButton } from "./components/sk-button/sk-button.js"
export { SkCard } from "./components/sk-card/sk-card.js"
export { SkDialog } from "./components/sk-dialog/sk-dialog.js"
export { SkIconButton } from "./components/sk-icon-button/sk-icon-button.js"
export { SkInput } from "./components/sk-input/sk-input.js"
export { SkSelect } from "./components/sk-select/sk-select.js"
export { SkCheckbox } from "./components/sk-checkbox/sk-checkbox.js"
export { SkSwitch } from "./components/sk-switch/sk-switch.js"
export { SkRadioGroup } from "./components/sk-radio-group/sk-radio-group.js"
export { SkLabel } from "./components/sk-label/sk-label.js"
export { SkLink } from "./components/sk-link/sk-link.js"
export { SkSeparator } from "./components/sk-separator/sk-separator.js"
export { SkText } from "./components/sk-text/sk-text.js"
export { SkSkeleton } from "./components/sk-skeleton/sk-skeleton.js"
export { SkSpinner } from "./components/sk-spinner/sk-spinner.js"
export { SkTextarea } from "./components/sk-textarea/sk-textarea.js"
export { SkTabs } from "./components/sk-tabs/sk-tabs.js"
export { SkTab } from "./components/sk-tabs/sk-tab.js"
export { SkTabPanel } from "./components/sk-tabs/sk-tab-panel.js"
export { SkToast } from "./components/sk-toast/sk-toast.js"
export { SkTooltip } from "./components/sk-tooltip/sk-tooltip.js"
export type { ButtonSize, ButtonType, ButtonVariant } from "./components/shared/button-base.js"

/** Custom element tags this package defines. */
export const COMPONENTS = [
  "sk-alert-dialog",
  "sk-badge",
  "sk-button",
  "sk-card",
  "sk-dialog",
  "sk-icon-button",
  "sk-input",
  "sk-select",
  "sk-checkbox",
  "sk-switch",
  "sk-radio-group",
  "sk-label",
  "sk-link",
  "sk-separator",
  "sk-skeleton",
  "sk-spinner",
  "sk-tab",
  "sk-tab-panel",
  "sk-tabs",
  "sk-text",
  "sk-textarea",
  "sk-toast",
  "sk-tooltip",
]
