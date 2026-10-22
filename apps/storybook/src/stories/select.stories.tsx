import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Select } from "@santaka-ui/react"

/**
 * Select stories.
 *
 * `options` is an array of `SelectOption` objects — `{ value, label,
 * disabled? }` — which the adapter serializes to JSON for the element's
 * attribute. All controlled props are real props from
 * `packages/react/src/select.tsx`; nothing story-local is invented.
 */
const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "quiet"],
      description: "Visual emphasis of the field.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Control height.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: {
      control: "text",
      description: "Validation message. Its presence drives `aria-invalid`.",
    },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    placeholder: { control: "text" },
    options: { control: "object" },
  },
  args: {
    variant: "default",
    size: "md",
    label: "Shipping region",
    description: "Used to calculate delivery estimates.",
    options: [
      { value: "north", label: "North" },
      { value: "south", label: "South" },
      { value: "east", label: "East" },
      { value: "west", label: "West" },
    ],
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/** The default: a short option list with label and description. */
export const Default: Story = {}

/**
 * A placeholder shown when no value is chosen. The placeholder is not an
 * option — it renders only while the field is empty.
 */
export const Placeholder: Story = {
  args: {
    placeholder: "Choose a region…",
  },
}

/** The quiet variant. */
export const Quiet: Story = {
  args: { variant: "quiet" },
}

/** All sizes side by side. */
export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem", width: "16rem" }}>
      <Select {...args} size="sm" label="Small" />
      <Select {...args} size="md" label="Medium" />
      <Select {...args} size="lg" label="Large" />
    </div>
  ),
}

/** The error state: an `error` string renders the message and sets `aria-invalid`. */
export const Error: Story = {
  args: {
    required: true,
    error: "Choose a shipping region to continue.",
  },
}

/** Marked invalid without any error text — `invalid` alone. */
export const Invalid: Story = {
  args: { invalid: true },
}

/** Disabled: not submitted, not focusable. */
export const Disabled: Story = {
  args: { disabled: true },
}

/** Individual options can be disabled inside an otherwise enabled list. */
export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: "standard", label: "Standard (3–5 days)" },
      { value: "express", label: "Express (unavailable)", disabled: true },
      { value: "overnight", label: "Overnight" },
    ],
    placeholder: "Choose a delivery speed…",
  },
}

/**
 * A long option list. The popup must scroll rather than run off-screen, and
 * keyboard navigation must survive the full set.
 */
export const LongOptionList: Story = {
  args: {
    label: "Time zone",
    options: Array.from({ length: 24 }, (_, hour) => ({
      value: `utc${hour >= 12 ? "+" : "-"}${Math.abs(hour - 12)}`,
      label: `UTC${hour >= 12 ? "+" : "-"}${String(Math.abs(hour - 12)).padStart(2, "0")}:00`,
    })),
    placeholder: "Choose a time zone…",
  },
}

/**
 * Interaction test (docs/ARCHITECTURE.md §10): choosing an option updates the real native
 * `<select>`. The control is a visible `<select>`, not a custom listbox over a
 * hidden one (ADR-013), so `selectOptions` drives the platform directly.
 */
export const Choosing: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const control = await canvas.findByRole("combobox", { name: "Shipping region" })
    await userEvent.selectOptions(control, "south")
    await expect(control).toHaveValue("south")
  },
}
