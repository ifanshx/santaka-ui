import type { Meta, StoryObj } from "@storybook/react-vite"
import { Banner, Button } from "@santaka-ui/react"

/**
 * Stories for the Banner adapter.
 *
 * The `aria-label` requirement is the thing worth showing: ARIA only exposes a
 * `region` as a landmark when it has an accessible name, so an unnamed banner is
 * unreachable by landmark navigation. The type enforces it; these stories show
 * it in use.
 */
const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "primary", "success", "warning", "danger"],
      description: "Visual emphasis.",
    },
    heading: { control: "text", description: "Heading text." },
    fullWidth: {
      control: "boolean",
      description: "Spans the container as a strip. `false` keeps the box chrome.",
    },
  },
  args: {
    "aria-label": "Service status",
    children: "The dashboard is read-only on Saturday between 02:00 and 04:00 UTC.",
    variant: "warning",
    heading: "Scheduled maintenance",
    fullWidth: true,
  },
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

/** The default: a full-width strip with a heading. */
export const Default: Story = {}

/** All variants side by side. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Banner variant="neutral" aria-label="Notice">
        A neutral, informational message.
      </Banner>
      <Banner variant="primary" aria-label="Notice">
        A primary announcement.
      </Banner>
      <Banner variant="success" aria-label="Notice">
        Everything is healthy.
      </Banner>
      <Banner variant="warning" aria-label="Notice">
        Something needs attention soon.
      </Banner>
      <Banner variant="danger" aria-label="Notice">
        Something is broken.
      </Banner>
    </div>
  ),
}

/**
 * Inline: `fullWidth={false}` keeps the offset shadow and side borders, for a
 * message about one section rather than the whole page.
 */
export const Inline: Story = {
  args: { fullWidth: false, variant: "primary" },
}

/** With an action in the `actions` slot. */
export const WithAction: Story = {
  render: () => (
    <Banner variant="warning" heading="Trial ends in 3 days" aria-label="Account status">
      Add a payment method to keep your projects online.
      {/*
        Slot assignment is the browser's, not React's: `slot` is a real DOM
        attribute on the child, which is why a plain element carries it rather
        than a prop on the adapter. The same rule the Card and Empty State
        adapters record.
      */}
      <span slot="actions">
        <Button size="sm" variant="secondary">
          Add payment method
        </Button>
      </span>
    </Banner>
  ),
}
