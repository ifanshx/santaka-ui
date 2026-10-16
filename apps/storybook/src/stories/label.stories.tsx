import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input, Label } from "@santaka-ui/react"

/**
 * Label stories.
 *
 * `htmlFor` is required. Per the adapter's source comment, field components
 * render their control with the id `${hostId}-control`, so when pointing at
 * one of those controls the `for` target must carry the `-control` suffix.
 * Here the paired Inputs are given explicit `id`s (`contact-name` /
 * `contact-name-control`) so the association is deterministic and visible in
 * the DOM. `required` only renders the marker — the control's own `required`
 * carries the semantics.
 */
const meta = {
  title: "Components/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    htmlFor: {
      control: "text",
      description:
        "The id of the control this label names. Field components render their control as `${hostId}-control`, so `for` must carry that suffix.",
    },
    required: {
      control: "boolean",
      description:
        "Renders the required marker. The control's own `required` carries the semantics.",
    },
    marker: {
      control: "inline-radio",
      options: ["after", "before"],
      description: "Where the marker sits. `before` when the control leads the sentence.",
    },
    children: { control: "text" },
  },
  args: {
    htmlFor: "contact-name-control",
    children: "Contact name",
    required: false,
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

/** The default: plain label, no marker. Paired with a real control. */
export const Default: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.375rem", width: "20rem" }}>
      <Label {...args} />
      <Input id="contact-name-control" name="contact-name" />
    </div>
  ),
}

/** The required marker renders after the text; the Input itself is `required`. */
export const Required: Story = {
  args: { required: true },
  render: (args) => (
    <div style={{ display: "grid", gap: "0.375rem", width: "20rem" }}>
      <Label {...args} />
      <Input id="contact-name-control" name="contact-name" required />
    </div>
  ),
}

/** The marker before the text — for sentences where the control leads. */
export const MarkerBefore: Story = {
  args: { required: true, marker: "before" },
  render: (args) => (
    <div style={{ display: "grid", gap: "0.375rem", width: "20rem" }}>
      <Label {...args} />
      <Input id="contact-name-control" name="contact-name" required />
    </div>
  ),
}

/** The marker after the text, shown explicitly. */
export const MarkerAfter: Story = {
  args: { required: true, marker: "after" },
  render: (args) => (
    <div style={{ display: "grid", gap: "0.375rem", width: "20rem" }}>
      <Label {...args} />
      <Input id="contact-name-control" name="contact-name" required />
    </div>
  ),
}

/**
 * A standalone label pointing at an explicit id. Since the target here is not
 * a field component host, there is no `-control` suffix to honor — `htmlFor`
 * matches the control's id directly.
 */
export const Standalone: Story = {
  args: { htmlFor: "newsletter-email" },
  render: (args) => (
    <div style={{ display: "grid", gap: "0.375rem", width: "20rem" }}>
      <Label {...args} required marker="after">
        Email for the newsletter
      </Label>
      <Input id="newsletter-email" name="newsletter-email" type="email" required />
    </div>
  ),
}
