import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { RadioGroup } from "@santaka-ui/react"

/**
 * RadioGroup stories.
 *
 * `options` is required and is an array of `{ value, label, disabled? }` —
 * the group owns `name` and `required`; the checked radio's value is what a
 * plain form submits.
 */
const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    options: {
      description: "The choices, each `{ value, label, disabled? }`. Passed as a property.",
    },
    variant: {
      control: "select",
      options: ["default", "quiet"],
      description: "Visual emphasis.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Label and option text size.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "none", label: "No notifications" },
    ],
    // `name` is required on the adapter, not optional: a radio group with no
    // name does not submit, and the group's radios have no shared identity for
    // the browser to make exclusive. The story must supply one, exactly as a
    // consumer must.
    name: "contact-method",
    label: "How should we reach you?",
    variant: "default",
    size: "md",
    description: "",
    error: "",
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

/** The default group with three options, nothing preselected. */
export const Default: Story = {}

/** A preselected value, which is what most real forms ship. */
export const WithSelection: Story = { args: { defaultValue: "email" } }

/** Persistent helper text below the group label. */
export const WithDescription: Story = {
  args: {
    label: "Delivery speed",
    description: "Applies to all future orders on this account.",
    options: [
      { value: "standard", label: "Standard (3–5 days)" },
      { value: "express", label: "Express (1–2 days)" },
    ],
  },
}

/** The validation message is announced; its presence drives `aria-invalid`. */
export const Error: Story = {
  args: {
    label: "Choose a plan",
    error: "Select a plan to continue.",
    invalid: true,
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
    ],
  },
}

/** The whole group is disabled, mirroring the ARIA name. */
export const Disabled: Story = {
  args: {
    label: "Legacy shipping",
    disabled: true,
    description: "These methods are no longer offered.",
    options: [
      { value: "courier", label: "Courier" },
      { value: "pickup", label: "Pickup" },
    ],
  },
}

/** A single option can be disabled while the rest stay interactive. */
export const OptionDisabled: Story = {
  args: {
    label: "Payment method",
    options: [
      { value: "card", label: "Card" },
      { value: "invoice", label: "Invoice", disabled: true },
      { value: "crypto", label: "Crypto" },
    ],
  },
}

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <RadioGroup {...args} size="sm" label="Small" />
      <RadioGroup {...args} size="md" label="Medium" />
      <RadioGroup {...args} size="lg" label="Large" />
    </div>
  ),
}

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <RadioGroup {...args} variant="default" label="Default" />
      <RadioGroup {...args} variant="quiet" label="Quiet" />
    </div>
  ),
}

/**
 * Interaction test (plan.md §10): selecting a radio checks it. The options are
 * real native radios inside `role="radiogroup"`, so the assertion reads the
 * platform's own checked state.
 */
export const Selecting: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const sms = await canvas.findByRole("radio", { name: "SMS" })
    await expect(sms).not.toBeChecked()
    await userEvent.click(sms)
    await expect(sms).toBeChecked()
  },
}
