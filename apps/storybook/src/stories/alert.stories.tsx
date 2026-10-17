import type { Meta, StoryObj } from "@storybook/react-vite"
import { Alert } from "@santaka-ui/react"

/**
 * Alert stories.
 *
 * An alert is inline chrome, not a floating layer (sk-toast is the floating
 * one), so every story renders in the document flow and pushes content down.
 * The component owns no state and has no dismiss button — it only ever states;
 * it never hides itself.
 */
const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "primary", "success", "warning", "danger"],
      description:
        'Visual emphasis, and the default live-region role: `danger` and `warning` render `role="alert"`, the rest `role="status"`.',
    },
    heading: {
      control: "text",
      description:
        "Plain-text heading rendered as a `<span>`, for the same reason Card's heading is not a heading element.",
    },
    children: { control: "text" },
  },
  args: {
    variant: "neutral",
    heading: "",
    children: "Body text under the heading.",
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

/** The default: neutral, no heading, one line of body text. */
export const Neutral: Story = {}

export const Primary: Story = {
  args: { variant: "primary", children: "A change is scheduled for tonight." },
}

/**
 * `danger` renders `role="alert"` — an error appearing in place should
 * interrupt, unlike the `role="status"` the neutral variants get.
 */
export const Danger: Story = {
  args: {
    variant: "danger",
    heading: "Connection lost",
    children: "Your edits are saved locally.",
  },
}

/**
 * Warning renders `role="alert"` too: the reader must hear it, which is why
 * the two interrupting variants are exactly the two most severe ones.
 */
export const Warning: Story = {
  args: {
    variant: "warning",
    heading: "Storage almost full",
    children: "90% of the quota is used.",
  },
}

export const Success: Story = {
  args: { variant: "success", heading: "Saved", children: "Changes synced to the server." },
}

/** All variants side by side, to check they read as one family. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: "36rem" }}>
      <Alert variant="neutral">Neutral: information the reader can take or leave.</Alert>
      <Alert variant="primary">Primary: an ordinary, non-urgent update worth pointing at.</Alert>
      <Alert variant="success" heading="Saved">
        Changes synced to the server.
      </Alert>
      <Alert variant="warning" heading="Storage almost full">
        90% of the quota is used.
      </Alert>
      <Alert variant="danger" heading="Connection lost">
        Your edits are saved locally.
      </Alert>
    </div>
  ),
}

/**
 * An alert with actions: the consumer's buttons land in the `actions` slot,
 * which is removed by CSS when unfilled. React renders light DOM, so plain
 * `slot="actions"` children slot exactly as they do in plain HTML.
 */
export const WithActions: Story = {
  render: () => (
    <div style={{ maxWidth: "36rem" }}>
      <Alert variant="warning" heading="Unsaved changes">
        You have edits that were never saved.
        <div slot="actions" style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button">Discard</button>
          <button type="button">Save</button>
        </div>
      </Alert>
    </div>
  ),
}
