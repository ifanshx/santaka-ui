import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Input } from "@santaka-ui/react"

/**
 * Input stories.
 *
 * Same discipline as the Button reference: import from the published
 * `@santaka-ui/react` entry point, and only control props that exist on the
 * adapter (`packages/react/src/input.tsx`). The `error` prop's presence is
 * what drives `aria-invalid` on the control, so an Error story with error
 * text is the accessible-invalid state; `invalid` alone marks the field
 * without any message.
 */
const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "tel", "url", "number"],
      description: "Native input type, forwarded to the underlying `<input>`.",
    },
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
  },
  args: {
    type: "text",
    variant: "default",
    size: "md",
    label: "Email address",
    description: "We only use this for signing in, never marketing.",
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

/** The default: default variant, medium size, enabled, with label and description. */
export const Default: Story = {}

/** The quiet variant — borderless emphasis for dense layouts. */
export const Quiet: Story = { args: { variant: "quiet" } }

/** All sizes side by side to check they read as one family. */
export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem", width: "20rem" }}>
      <Input {...args} size="sm" label="Small" />
      <Input {...args} size="md" label="Medium" />
      <Input {...args} size="lg" label="Large" />
    </div>
  ),
}

/** Both variants side by side. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem", width: "20rem" }}>
      <Input {...args} variant="default" label="Default" />
      <Input {...args} variant="quiet" label="Quiet" />
    </div>
  ),
}

/**
 * The error state: an `error` string renders the validation message and the
 * adapter sets `aria-invalid` because the prop is present.
 */
export const Error: Story = {
  args: {
    error: "Enter an email address in the format name@example.com.",
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

/**
 * A long value with a long label. The field must hold the value and wrap the
 * label without clipping its focus ring — the failure a short-text-only set
 * of stories never shows.
 */
export const LongValue: Story = {
  args: {
    label: "Emergency contact address, including any suite, floor, or department identifiers",
    defaultValue:
      "Building 7, Suite 900, North Quadrant Annex, 4821 Harborview Parkway Extension West, Fieldstone Bay, WA 98210-4437",
  },
}

/**
 * Interaction test (docs/ARCHITECTURE.md §10): typing reaches the native `<input>`, which
 * owns the value. The accessible name comes from the element's own `<label>`,
 * so `getByRole` with a name is also a check that the label wiring held.
 */
export const Typing: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const field = await canvas.findByRole("textbox", { name: "Email address" })
    await userEvent.type(field, "reader@example.com")
    await expect(field).toHaveValue("reader@example.com")
  },
}
