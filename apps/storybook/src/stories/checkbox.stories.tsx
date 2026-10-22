import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Checkbox } from "@santaka-ui/react"

/**
 * Checkbox stories.
 *
 * Same rules as the button reference:
 *
 * 1. Import from `@santaka-ui/react`, the published entry point.
 * 2. Every control is a real prop of the adapter.
 *
 * `label` is required on the adapter, so every story carries one — there is
 * no bare-checkbox story to write. The `size` prop only changes the label
 * text size; the row target stays 44px at every size, so touch accuracy
 * never depends on which size was chosen.
 */
const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "quiet"],
      description: "Visual emphasis.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Label text size. The row target stays 44px at every size.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
    indeterminate: {
      control: "boolean",
      description: "Visual state only — an indeterminate checkbox submits as unchecked.",
    },
  },
  args: {
    label: "Send me updates",
    variant: "default",
    size: "md",
    description: "",
    error: "",
    invalid: false,
    disabled: false,
    indeterminate: false,
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/** The default: default variant, medium size, enabled, unchecked. */
export const Unchecked: Story = {}

export const Checked: Story = { args: { checked: true } }

/**
 * `indeterminate` is visual state, not form state: the checkbox still submits
 * as unchecked, which is what the platform does.
 */
export const Indeterminate: Story = { args: { indeterminate: true } }

/** Persistent helper text below the row. */
export const WithDescription: Story = {
  args: {
    label: "Email notifications",
    description: "We send at most one digest per week.",
  },
}

/** The validation message is announced; its presence drives `aria-invalid`. */
export const Error: Story = {
  args: {
    label: "Accept the terms",
    error: "You must accept the terms to continue.",
    invalid: true,
  },
}

/** A real disabled attribute — the control leaves the tab order. */
export const Disabled: Story = {
  args: {
    label: "Archived option",
    disabled: true,
    description: "This setting is managed by your organization.",
  },
}

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Checkbox {...args} size="sm" label="Small" />
      <Checkbox {...args} size="md" label="Medium" />
      <Checkbox {...args} size="lg" label="Large" />
    </div>
  ),
}

/**
 * Sizes side by side in the checked state, where the difference between the
 * box, check mark, and label rendering is easiest to see.
 */
export const AllSizesChecked: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Checkbox {...args} size="sm" label="Small" checked />
      <Checkbox {...args} size="md" label="Medium" checked />
      <Checkbox {...args} size="lg" label="Large" checked />
    </div>
  ),
}

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Checkbox {...args} variant="default" label="Default" checked />
      <Checkbox {...args} variant="quiet" label="Quiet" checked />
    </div>
  ),
}

/**
 * Interaction test (docs/ARCHITECTURE.md §10). The control is a real `<input
 * type="checkbox">` in light DOM, so `getByRole` finds it and a real click
 * flips it — the same path a consumer's form uses, not a synthetic state write.
 */
export const Toggles: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const control = await canvas.findByRole("checkbox")
    await expect(control).not.toBeChecked()
    await userEvent.click(control)
    await expect(control).toBeChecked()
  },
}
