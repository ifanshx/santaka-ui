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
export { SkAccordion } from "./components/sk-accordion/sk-accordion.js"
export { SkAccordionItem } from "./components/sk-accordion/sk-accordion-item.js"
export { SkAlert } from "./components/sk-alert/sk-alert.js"
export { SkAlertDialog } from "./components/sk-alert-dialog/sk-alert-dialog.js"
export { SkAvatar } from "./components/sk-avatar/sk-avatar.js"
export { SkAvatarGroup } from "./components/sk-avatar-group/sk-avatar-group.js"
export { SkBadge } from "./components/sk-badge/sk-badge.js"
export { SkBanner } from "./components/sk-banner/sk-banner.js"
export { SkBreadcrumb } from "./components/sk-breadcrumb/sk-breadcrumb.js"
export { SkPagination } from "./components/sk-pagination/sk-pagination.js"
export { SkButton } from "./components/sk-button/sk-button.js"
export { SkCard } from "./components/sk-card/sk-card.js"
export { SkCombobox } from "./components/sk-combobox/sk-combobox.js"
export { SkDialog } from "./components/sk-dialog/sk-dialog.js"
export { SkDrawer } from "./components/sk-drawer/sk-drawer.js"
export { SkEmptyState } from "./components/sk-empty-state/sk-empty-state.js"
export { SkField } from "./components/sk-field/sk-field.js"
export { SkIconButton } from "./components/sk-icon-button/sk-icon-button.js"
export { SkInput } from "./components/sk-input/sk-input.js"
export { SkKbd } from "./components/sk-kbd/sk-kbd.js"
export { SkSelect } from "./components/sk-select/sk-select.js"
export { SkCheckbox } from "./components/sk-checkbox/sk-checkbox.js"
export { SkSwitch } from "./components/sk-switch/sk-switch.js"
export { SkRadioGroup } from "./components/sk-radio-group/sk-radio-group.js"
export { SkLabel } from "./components/sk-label/sk-label.js"
export { SkLink } from "./components/sk-link/sk-link.js"
export { SkProgress } from "./components/sk-progress/sk-progress.js"
export { SkPopover } from "./components/sk-popover/sk-popover.js"
export { SkSeparator } from "./components/sk-separator/sk-separator.js"
export { SkSlider } from "./components/sk-slider/sk-slider.js"
export { SkTable } from "./components/sk-table/sk-table.js"
export { SkText } from "./components/sk-text/sk-text.js"
export { SkSkeleton } from "./components/sk-skeleton/sk-skeleton.js"
export { SkSpinner } from "./components/sk-spinner/sk-spinner.js"
export { SkTextarea } from "./components/sk-textarea/sk-textarea.js"
export { SkTabs } from "./components/sk-tabs/sk-tabs.js"
export { SkTab } from "./components/sk-tabs/sk-tab.js"
export { SkTabPanel } from "./components/sk-tabs/sk-tab-panel.js"
export { SkTaka } from "./components/sk-taka/sk-taka.js"
export { SkToast } from "./components/sk-toast/sk-toast.js"
export { SkTooltip } from "./components/sk-tooltip/sk-tooltip.js"
export type { ButtonSize, ButtonType, ButtonVariant } from "./components/shared/button-base.js"

/** Custom element tags this package defines. */
export const COMPONENTS = [
  "sk-accordion",
  "sk-accordion-item",
  "sk-alert",
  "sk-alert-dialog",
  "sk-avatar",
  "sk-avatar-group",
  "sk-badge",
  "sk-banner",
  "sk-breadcrumb",
  "sk-pagination",
  "sk-button",
  "sk-card",
  "sk-combobox",
  "sk-dialog",
  "sk-drawer",
  "sk-empty-state",
  "sk-icon-button",
  "sk-input",
  "sk-kbd",
  "sk-field",
  "sk-select",
  "sk-checkbox",
  "sk-switch",
  "sk-radio-group",
  "sk-label",
  "sk-link",
  "sk-progress",
  "sk-popover",
  "sk-separator",
  "sk-slider",
  "sk-skeleton",
  "sk-spinner",
  "sk-tab",
  "sk-tab-panel",
  "sk-tabs",
  "sk-taka",
  "sk-table",
  "sk-text",
  "sk-textarea",
  "sk-toast",
  "sk-tooltip",
]
