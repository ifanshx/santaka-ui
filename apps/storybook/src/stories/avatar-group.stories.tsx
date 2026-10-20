import type { Meta, StoryObj } from "@storybook/react-vite"
import { Avatar, AvatarGroup } from "@santaka-ui/react"

/**
 * Stories for the AvatarGroup adapter.
 *
 * `label` is required by the type: an unnamed `role="group"` is skipped by most
 * screen readers, so without it the group is not a landmark at all.
 */
const people = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Barbara Liskov",
]

const meta = {
  title: "Components/AvatarGroup",
  component: AvatarGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    max: {
      control: { type: "number", min: 0, max: 6 },
      description: "How many to show before collapsing the rest into a count. `0` shows all.",
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"], description: "Diameter." },
  },
  args: {
    label: "Assigned to",
    max: 3,
    size: "md",
  },
} satisfies Meta<typeof AvatarGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Five people, three shown, so the overflow count is "+2". */
export const Default: Story = {
  render: () => (
    <AvatarGroup label="Assigned to" max={3}>
      {people.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  ),
}

/** `max=0` shows everyone and renders no overflow. */
export const ShowAll: Story = {
  render: () => (
    <AvatarGroup label="Assigned to" max={0}>
      {people.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  ),
}

/** All three sizes side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <AvatarGroup label="Small" max={3} size="sm">
        {people.map((name) => (
          <Avatar key={name} name={name} size="sm" />
        ))}
      </AvatarGroup>
      <AvatarGroup label="Medium" max={3} size="md">
        {people.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
      <AvatarGroup label="Large" max={3} size="lg">
        {people.map((name) => (
          <Avatar key={name} name={name} size="lg" />
        ))}
      </AvatarGroup>
    </div>
  ),
}

/**
 * Raising `max` past the number of people collapses nothing — which is the case
 * that proves the overflow is derived from the count rather than hardcoded.
 */
export const NoOverflow: Story = {
  render: () => (
    <AvatarGroup label="Reviewers" max={10}>
      {people.slice(0, 2).map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  ),
}
