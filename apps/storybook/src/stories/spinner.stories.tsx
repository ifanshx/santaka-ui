import type { Meta, StoryObj } from "@storybook/react-vite"
import { Spinner } from "@santaka-ui/react"

/**
 * Spinner stories.
 *
 * `label` is what the wait is announced as; it defaults to "Loading" in the
 * component. `status` replaces the label when progress is known, so a story
 * with `status` set is a different announcement, not an additional one.
 */
const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Ring diameter, from the icon-size tokens so it matches the icon beside it.",
    },
    label: {
      control: "text",
      description: 'What the wait is, announced to screen readers. Defaults to "Loading".',
    },
    status: {
      control: "text",
      description: 'Replaces the label when progress is known, e.g. "Uploading 60%".',
    },
  },
  args: {
    label: "Loading",
    size: "md",
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

/** The default: medium size, announced as "Loading". */
export const Default: Story = {}

/** An intentional label reads better than the default in context. */
export const CustomLabel: Story = {
  args: { label: "Fetching your results" },
}

/**
 * With progress known, `status` replaces the label — "Uploading 60%" is the
 * whole announcement, not "Loading, Uploading 60%".
 */
export const WithStatus: Story = {
  args: { status: "Uploading 60%" },
}

export const Small: Story = { args: { size: "sm" } }
export const Medium: Story = { args: { size: "md" } }
export const Large: Story = { args: { size: "lg" } }

/** Sizes side by side; each matches the icon tokens it sits next to. */
export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      <Spinner {...args} size="sm" />
      <Spinner {...args} size="md" />
      <Spinner {...args} size="lg" />
    </div>
  ),
}
