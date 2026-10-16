import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "@santaka-ui/react"

/**
 * Stories for the Badge adapter. Every control is a real prop of the adapter:
 * `variant`, `size`, and the `dot` + `statusLabel` pair, which the type system
 * requires together (WCAG 1.4.1 — a dot must not convey state by color alone).
 */
const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "primary", "success", "warning", "danger"],
      description: "Visual emphasis. `neutral` is the default and reads as chrome.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
      description: "Control height.",
    },
    dot: {
      control: "boolean",
      description: "Renders a dot instead of a pill. Requires `statusLabel`.",
    },
    statusLabel: {
      control: "text",
      description: "Visually hidden screen-reader text for the dot variant.",
    },
    children: { control: "text" },
  },
  args: {
    children: "Badge",
    variant: "neutral",
    size: "md",
    dot: false,
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

/** The default: neutral, medium. */
export const Neutral: Story = {}

export const Primary: Story = { args: { variant: "primary" } }
export const Success: Story = { args: { variant: "success" } }
export const Warning: Story = { args: { variant: "warning" } }
export const Danger: Story = { args: { variant: "danger" } }

/** All variants side by side, to check they read as one family. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
    </div>
  ),
}

/** Both sizes side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
}

/**
 * The dot variant. `statusLabel` is required by the type whenever `dot` is set:
 * a dot conveys state by color alone, so the label renders visually hidden for
 * assistive technology.
 */
export const Dot: Story = {
  args: {
    dot: true,
    statusLabel: "Service status: online",
    children: undefined,
  },
}

/**
 * A long label. The badge must grow or wrap gracefully without clipping, which
 * a short-label-only set of stories never shows.
 */
export const LongContent: Story = {
  args: {
    children: "Deployment failed: health checks timed out after three attempts",
  },
}
