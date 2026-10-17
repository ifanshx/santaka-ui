import { expect, within } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Progress } from "@santaka-ui/react"

/**
 * Progress stories.
 *
 * A progress bar is a status display, not a control: it takes no focus and has
 * no press state. `aria-valuenow`'s omission is the indeterminate signal — a
 * determinate fill promises a percentage, an indeterminate sweep does not,
 * and the two must never be confused. The component renders no percentage
 * text; formatting one is a locale question it does not own.
 */
const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "number",
      description: "Current value. Omit (or pass a non-finite value) for the indeterminate sweep.",
    },
    max: {
      control: "number",
      description: "The scale the value is measured against.",
    },
    label: {
      control: "text",
      description: "Accessible name, rendered as `aria-label` only when the consumer has set none.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Track height scale.",
    },
  },
  args: {
    value: 40,
    max: 100,
    label: "Upload progress",
    size: "md",
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

/** The default: determinate, medium, at a partial fill worth reading. */
export const Determinate: Story = {}

/**
 * No `value` means the task's length is unknown, so the bar sweeps instead of
 * filling — and carries no `aria-valuenow`, which is the spec's indeterminate
 * signal for assistive tech.
 */
export const Indeterminate: Story = {
  args: { value: undefined },
}

/** All sizes side by side. Height is the only thing that changes. */
export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem", width: "20rem" }}>
      <Progress {...args} size="sm" label="Small" />
      <Progress {...args} size="md" label="Medium" />
      <Progress {...args} size="lg" label="Large" />
    </div>
  ),
}

/** A real value against a non-100 scale, as a finite uploader would report. */
export const CustomMax: Story = {
  args: { value: 45, max: 60, label: "Files transferred" },
}

/**
 * Interaction test (plan.md §10): the honest aria state — `aria-valuenow`
 * present when determinate, absent here — is what the story cannot show
 * statically, because the paint looks plausible either way.
 */
export const IndeterminateHasNoValueNow: Story = {
  args: { value: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole("progressbar")
    await expect(bar).toHaveAttribute("aria-valuemax", "100")
    await expect(bar).not.toHaveAttribute("aria-valuenow")
  },
}
