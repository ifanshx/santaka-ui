/**
 * `@santaka-ui/vue` — thin Vue 3 adapters over the `@santaka-ui/web-components`
 * custom elements.
 *
 * The export order and the export names mirror `@santaka-ui/react` exactly, so a
 * consumer moving between the two adapters finds the same surface. Section 4
 * requires exactly one implementation to own each component's behavior: every
 * component here is owned by `@santaka-ui/web-components`, and these adapters
 * carry typing, prop/attr mapping, event ergonomics, and form wiring only.
 */
export { Button } from "./button.js"
export type {
  ButtonProps,
  ButtonSize,
  ButtonType,
  ButtonVariant,
  SkButtonElement,
} from "./button.js"
export { IconButton } from "./icon-button.js"
export type { IconButtonProps, SkIconButtonElement } from "./icon-button.js"
export { Badge } from "./badge.js"
export type { BadgeProps, BadgeVariant, BadgeSize, DotBadgeProps, SkBadgeElement } from "./badge.js"
export { Avatar } from "./avatar.js"
export type { AvatarProps, AvatarSize, SkAvatarElement } from "./avatar.js"
export { AvatarGroup } from "./avatar-group.js"
export type { AvatarGroupProps, SkAvatarGroupElement } from "./avatar-group.js"
export { Banner } from "./banner.js"
export type { BannerProps, BannerVariant, SkBannerElement } from "./banner.js"
export { Kbd } from "./kbd.js"
export type { KbdProps, KbdSize, SkKbdElement } from "./kbd.js"
export { Card } from "./card.js"
export type { CardProps, SkCardElement } from "./card.js"
export { Link } from "./link.js"
export type { LinkProps, SkLinkElement } from "./link.js"
export { Input } from "./input.js"
export type { InputProps, InputType, SkInputElement } from "./input.js"
export { Select } from "./select.js"
export type { SelectProps, SelectOption, SkSelectElement } from "./select.js"
export { Textarea } from "./textarea.js"
export type { TextareaProps, SkTextareaElement } from "./textarea.js"
export { Text } from "./text.js"
export type { TextProps, SkTextElement } from "./text.js"
export { Checkbox } from "./checkbox.js"
export type { CheckboxProps, CheckboxSize, CheckboxVariant, SkCheckboxElement } from "./checkbox.js"
export { Switch } from "./switch.js"
export type { SwitchProps, SwitchSize, SwitchVariant, SkSwitchElement } from "./switch.js"
export { RadioGroup } from "./radio-group.js"
export type {
  RadioGroupProps,
  RadioGroupSize,
  RadioGroupVariant,
  RadioOption,
  SkRadioGroupElement,
} from "./radio-group.js"
export { Spinner } from "./spinner.js"
export type { SpinnerProps, SkSpinnerElement } from "./spinner.js"
export { Skeleton } from "./skeleton.js"
export type { SkeletonProps, SkSkeletonElement } from "./skeleton.js"
export { Alert } from "./alert.js"
export type { AlertProps, SkAlertElement } from "./alert.js"
export { Progress } from "./progress.js"
export type { ProgressProps, SkProgressElement } from "./progress.js"
export { EmptyState } from "./empty-state.js"
export type { EmptyStateProps, SkEmptyStateElement } from "./empty-state.js"
export { Accordion, AccordionItem } from "./accordion.js"
export type {
  AccordionProps,
  AccordionItemProps,
  SkAccordionElement,
  SkAccordionItemElement,
} from "./accordion.js"
export { Table } from "./table.js"
export type { TableProps, SkTableElement } from "./table.js"
export { Label } from "./label.js"
export type { LabelProps, SkLabelElement } from "./label.js"
export { Field } from "./field.js"
export type { FieldProps, SkFieldElement } from "./field.js"
export { Separator } from "./separator.js"
export type { SeparatorProps, SkSeparatorElement } from "./separator.js"
export { Dialog, DialogTrigger, DialogContent } from "./dialog.js"
export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
  SkDialogElement,
} from "./dialog.js"
export { ThemeScript, useTheme, THEME_STORAGE_KEY, THEME_INIT_SCRIPT } from "./theme.js"
export type { ResolvedTheme, ThemePreference, UseThemeReturn } from "./theme.js"
export { AlertDialog, AlertDialogContent } from "./alert-dialog.js"
export type {
  AlertDialogProps,
  AlertDialogContentProps,
  SkAlertDialogElement,
} from "./alert-dialog.js"
export { Toast } from "./toast.js"
export type { ToastProps, SkToastElement } from "./toast.js"
export { Tooltip, TooltipTrigger } from "./tooltip.js"
export type { TooltipProps, TooltipTriggerProps, SkTooltipElement } from "./tooltip.js"
export { Tabs, TabsList, Tab, TabPanel } from "./tabs.js"
export type {
  TabsProps,
  TabsListProps,
  TabProps,
  TabPanelProps,
  SkTabsElement,
  SkTabElement,
  SkTabPanelElement,
} from "./tabs.js"
export { Breadcrumb } from "./breadcrumb.js"
export type { BreadcrumbProps, Crumb, SkBreadcrumbElement } from "./breadcrumb.js"
export { Combobox } from "./combobox.js"
export type { ComboboxProps, ComboOption, SkComboboxElement } from "./combobox.js"
export { Drawer } from "./drawer.js"
export type { DrawerProps, SkDrawerElement } from "./drawer.js"
export { Pagination } from "./pagination.js"
export type { PaginationProps, SkPaginationElement } from "./pagination.js"
export { Popover } from "./popover.js"
export type { PopoverProps, SkPopoverElement } from "./popover.js"
export { Slider } from "./slider.js"
export type { SliderProps, SkSliderElement } from "./slider.js"
export { Taka } from "./taka.js"
export type { TakaProps, SkTakaElement } from "./taka.js"
