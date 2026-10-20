import type { Meta, StoryObj } from "@storybook/react-vite"
import { Taka } from "@santaka-ui/react"

/**
 * Stories for Taka, the project mascot.
 *
 * §1.8 reserves the mascot for onboarding, empty states, and easter eggs rather
 * than every screen — and §13 requires the artwork be original, which is why it is
 * drawn as SVG paths here rather than imported.
 */
const meta = {
  title: "Components/Taka",
  component: Taka,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    mood: {
      control: "inline-radio",
      options: ["idle", "wave", "bounce"],
      description: "Idle animations are removed outright under prefers-reduced-motion.",
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  args: {
    mood: "idle",
    size: "md",
  },
} satisfies Meta<typeof Taka>

export default meta
type Story = StoryObj<typeof meta>

/** Still portrait. The right default for most empty states. */
export const Idle: Story = {}

/** Waves its crest. For onboarding and first-run screens. */
export const Wave: Story = {
  args: { mood: "wave", size: "lg" },
}

/** Bounces. For easter eggs. */
export const Bounce: Story = {
  args: { mood: "bounce" },
}

/** All three moods and sizes side by side. */
export const AllMoods: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
      <Taka mood="idle" size="sm" />
      <Taka mood="wave" size="md" />
      <Taka mood="bounce" size="lg" />
    </div>
  ),
}
