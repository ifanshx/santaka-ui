import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Switch } from "@santaka-ui/react"

/**
 * Switch stories.
 *
 * The switch shares the Checkbox field contract (label, description, error,
 * invalid, disabled, sizes, variants) but acts immediately rather than being
 * collected for a later submit.
 *
 * `label` is required on the adapter, so every story carries one. As with
 * the checkbox, `size` only changes the label text size — the row target
 * stays 44px at every size.
 */
const meta = {
  title: "Components/Switch",
  component: Switch,
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
  },
  args: {
    label: "Enable notifications",
    variant: "default",
    size: "md",
    description: "",
    error: "",
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/** Off by default. */
export const Off: Story = {}

export const On: Story = { args: { checked: true } }

/** Persistent helper text below the row. */
export const WithDescription: Story = {
  args: {
    label: "Dark mode",
    description: "Applies immediately across the workspace.",
  },
}

/** The validation message is announced; its presence drives `aria-invalid`. */
export const Error: Story = {
  args: {
    label: "Data sharing",
    error: "Data sharing cannot be enabled on this plan.",
    invalid: true,
    checked: true,
  },
}

/** A real disabled attribute — the control leaves the tab order. */
export const Disabled: Story = {
  args: {
    label: "Beta features",
    disabled: true,
    description: "Not available until your account is verified.",
  },
}

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Switch {...args} size="sm" label="Small" />
      <Switch {...args} size="md" label="Medium" />
      <Switch {...args} size="lg" label="Large" />
    </div>
  ),
}

/** On-state sizes, where the track/thumb rendering differences show. */
export const AllSizesOn: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Switch {...args} size="sm" label="Small" checked />
      <Switch {...args} size="md" label="Medium" checked />
      <Switch {...args} size="lg" label="Large" checked />
    </div>
  ),
}

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Switch {...args} variant="default" label="Default" checked />
      <Switch {...args} variant="quiet" label="Quiet" checked />
    </div>
  ),
}

/**
 * Interaction test (plan.md §10). The control is a native checkbox carrying
 * `role="switch"`, so the assertion queries by that role and a real click
 * toggles it.
 */
export const Toggles: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const control = await canvas.findByRole("switch")
    await expect(control).not.toBeChecked()
    await userEvent.click(control)
    await expect(control).toBeChecked()
  },
}
