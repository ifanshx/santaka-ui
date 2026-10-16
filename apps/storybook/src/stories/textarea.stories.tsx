import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Textarea } from "@santaka-ui/react"

/**
 * Textarea stories.
 *
 * Imports only from `@santaka-ui/react`; every controlled prop is a real one
 * from `packages/react/src/textarea.tsx`. As with Input, the `error` prop's
 * presence drives `aria-invalid`, so Error is the accessible-invalid state.
 */
const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    rows: {
      control: "number",
      description: "Visible text rows.",
    },
    cols: {
      control: "number",
      description: "Visible text columns.",
    },
    variant: {
      control: "inline-radio",
      options: ["default", "quiet"],
      description: "Visual emphasis of the field.",
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
  },
  args: {
    variant: "default",
    label: "Release notes",
    description: "Describe what changed. Markdown is not supported.",
    rows: 4,
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

/** The default: default variant, label + description, 4 rows. */
export const Default: Story = {}

/** The quiet variant — borderless emphasis for dense layouts. */
export const Quiet: Story = { args: { variant: "quiet" } }

/**
 * A `rows` variation. The control must grow with the attribute rather than
 * clip or scroll early.
 */
export const Tall: Story = {
  args: { rows: 10 },
}

/** Both variants side by side. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem", width: "24rem" }}>
      <Textarea {...args} variant="default" label="Default" />
      <Textarea {...args} variant="quiet" label="Quiet" />
    </div>
  ),
}

/** The error state: an `error` string renders the message and sets `aria-invalid`. */
export const Error: Story = {
  args: {
    error: "Release notes are required before you can publish.",
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

/** Native constraint validation; the control's own `required` carries the semantics. */
export const Required: Story = {
  args: { required: true },
}

/** A long value: the textarea must hold a full paragraph without layout breakage. */
export const LongValue: Story = {
  args: {
    defaultValue:
      "Added the draft preview panel, fixed a race in the autosave queue that could drop the final keystroke, and reworked the migration runner so interrupted upgrades resume from the last committed batch instead of starting over. Includes 14 smaller fixes; see the linked changelog for the full list.",
  },
}

/**
 * Interaction test (plan.md §10): typing reaches the native `<textarea>`, which
 * owns the value. Unlike `<input>`, a textarea takes its content as children,
 * which is the reason this is worth proving rather than assuming.
 */
export const Typing: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const field = await canvas.findByRole("textbox", { name: "Release notes" })
    await userEvent.type(field, "Shipped the preview panel.")
    await expect(field).toHaveValue("Shipped the preview panel.")
  },
}
