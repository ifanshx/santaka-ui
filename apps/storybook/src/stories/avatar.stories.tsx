import type { Meta, StoryObj } from "@storybook/react-vite"
import { Avatar } from "@santaka-ui/react"

/**
 * Stories for the Avatar adapter.
 *
 * The two states that matter most are the ones a screenshot cannot distinguish:
 * `absent` (no `src` passed) and `error` (a broken URL) paint identically, and
 * `data-state` is what separates them. Both have stories here for that reason.
 */
const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description:
        "The person's name — the accessible name of the image and the source of the initials.",
    },
    src: { control: "text", description: "Image source. Without it, the initials render." },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Diameter.",
    },
  },
  args: {
    name: "Ada Lovelace",
    size: "md",
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

/** The default: initials only, so there is no image to load or fail. */
export const Initials: Story = {}

/** All three sizes side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
    </div>
  ),
}

/** With a real image. The initials sit underneath it and are revealed if it fails. */
export const WithImage: Story = {
  args: {
    name: "Grace Hopper",
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%236d28d9'/%3E%3C/svg%3E",
  },
}

/**
 * A broken image. It looks exactly like `Initials` — which is the point: the
 * component reports `data-state="error"` so a test or a screenshot diff can tell
 * a 404 apart from a consumer who simply passed no `src`.
 */
export const BrokenImage: Story = {
  args: {
    name: "Alan Turing",
    src: "/does-not-exist.png",
  },
}

/**
 * A single-word name. Initials take one character, so a mononym is not an empty
 * box. The parser is deliberately naive — name order and particles are locale
 * questions, and section 6 says locale is consumer-supplied.
 */
export const SingleName: Story = {
  args: { name: "Prince" },
}

/**
 * A long name, to show the initials stay two characters while the accessible
 * name stays the whole thing.
 */
export const LongName: Story = {
  args: { name: "Katherine Coleman Goble Johnson" },
}
