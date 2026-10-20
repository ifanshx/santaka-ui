import type { Meta, StoryObj } from "@storybook/react-vite"
import { Field } from "@santaka-ui/react"

/**
 * Stories for the Field adapter.
 *
 * The control is children, not a prop — that is the component's whole design, so
 * every story here slots a real `<input>` rather than passing one in.
 */
const meta = {
  title: "Components/Field",
  component: Field,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text", description: "Becomes the accessible name of the control." },
    description: { control: "text", description: "Persistent helper text." },
    error: { control: "text", description: "The validation message." },
    invalid: { control: "boolean" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Workspace name",
    description: "Lowercase letters and dashes.",
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

/** A plain `<input>` — the case this component exists for. */
export const PlainInput: Story = {
  render: (args) => (
    <Field {...args}>
      <input type="text" name="workspace" />
    </Field>
  ),
}

/**
 * With an error. The description stays in `aria-describedby` alongside the
 * error — an error that silences the hint removes the format instruction exactly
 * when the user needs it.
 */
export const WithError: Story = {
  args: { error: "That name is already taken." },
  render: (args) => (
    <Field {...args}>
      <input type="text" name="workspace" defaultValue="taken" />
    </Field>
  ),
}

/** Required. The asterisk is `aria-hidden`; the word "required" is announced. */
export const Required: Story = {
  args: { required: true, label: "Email", description: undefined },
  render: (args) => (
    <Field {...args}>
      <input type="email" name="email" />
    </Field>
  ),
}

/** Invalid with no message — a field can be invalid before the reason is known. */
export const InvalidWithoutMessage: Story = {
  args: { invalid: true, label: "Repository", description: undefined },
  render: (args) => (
    <Field {...args}>
      <input type="text" name="repo" />
    </Field>
  ),
}

/**
 * Several controls under one label. The field adopts the first for the ARIA
 * wiring, which is the documented limitation rather than a bug.
 */
export const MultipleControls: Story = {
  args: { label: "Date range", description: "Leave either end empty for an open range." },
  render: (args) => (
    <Field {...args}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input type="date" name="from" />
        <input type="date" name="to" />
      </div>
    </Field>
  ),
}
