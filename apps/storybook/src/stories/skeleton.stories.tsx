import type { Meta, StoryObj } from "@storybook/react-vite"
import { Skeleton } from "@santaka-ui/react"

/**
 * Stories for the Skeleton adapter. No `children` prop — real content replaces
 * the element. Real props only: `variant` and `direction`. Sizing comes from a
 * wrapper div, because the adapter forwards only `className`, not `style`.
 */
const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["text", "rect", "circle"],
      description: "The shape being promised. `text` tracks the body line height by default.",
    },
    direction: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description: "Shimmer direction. Set it for a right-to-left reading context.",
    },
  },
  args: {
    variant: "text",
    direction: "ltr",
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/** The default: a text-shaped line. */
export const Text: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Skeleton />
    </div>
  ),
}

/** A rectangular block, promising a card or image region. */
export const Rect: Story = {
  render: () => (
    <div style={{ width: 280, height: 120 }}>
      <Skeleton variant="rect" />
    </div>
  ),
}

/** A circle, promising an avatar. */
export const Circle: Story = {
  render: () => (
    <div style={{ width: 48, height: 48 }}>
      <Skeleton variant="circle" />
    </div>
  ),
}

/** All variants side by side, to check they read as one family. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <div style={{ width: 160 }}>
        <Skeleton variant="text" />
      </div>
      <div style={{ width: 120, height: 80 }}>
        <Skeleton variant="rect" />
      </div>
      <div style={{ width: 48, height: 48 }}>
        <Skeleton variant="circle" />
      </div>
    </div>
  ),
}

/** The shimmer running right-to-left, for a right-to-left reading context. */
export const Rtl: Story = {
  render: () => (
    <div dir="rtl" style={{ width: 280, display: "grid", gap: "0.5rem" }}>
      <Skeleton variant="text" direction="rtl" />
      <div style={{ width: "80%" }}>
        <Skeleton variant="text" direction="rtl" />
      </div>
    </div>
  ),
}
