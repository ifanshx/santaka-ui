import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Toast } from "@santaka-ui/react"

/**
 * Toast stories.
 *
 * A toast is announced when it appears and must not steal focus, so every
 * story keeps one mounted and open. `onDismiss` fires on any close — clock,
 * close button, or consumer — and each story uses it to flip its local
 * `open` state back off. `duration: 0` never expires.
 */
const meta = {
  title: "Components/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the toast is showing.",
    },
    duration: {
      control: "number",
      description: "Milliseconds before auto-dismiss. `0` never expires.",
    },
    variant: {
      control: "select",
      options: ["neutral", "success", "warning", "danger"],
      description: "Severity, drawn as a 3px left edge plus the message text.",
    },
    onDismiss: {
      action: "dismissed",
      description: "Fires on dismiss, whether by clock, button, or consumer.",
    },
  },
  args: {
    variant: "neutral",
    duration: 6000,
    children: "Changes saved",
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

/** The default: neutral, short-lived, dismissible from its close button. */
export const Neutral: Story = {
  render: function NeutralStory(args) {
    const [open, setOpen] = useState(true)
    return <Toast {...args} open={open} onDismiss={() => setOpen(false)} />
  },
}

export const Success: Story = {
  args: { variant: "success", children: "Deployment finished in 42s" },
  render: function SuccessStory(args) {
    const [open, setOpen] = useState(true)
    return <Toast {...args} open={open} onDismiss={() => setOpen(false)} />
  },
}

export const Warning: Story = {
  args: { variant: "warning", children: "Storage is 90% full" },
  render: function WarningStory(args) {
    const [open, setOpen] = useState(true)
    return <Toast {...args} open={open} onDismiss={() => setOpen(false)} />
  },
}

export const Danger: Story = {
  args: { variant: "danger", children: "Connection lost — retrying" },
  render: function DangerStory(args) {
    const [open, setOpen] = useState(true)
    return <Toast {...args} open={open} onDismiss={() => setOpen(false)} />
  },
}

/**
 * All four severities side by side, so a design review can ask whether they
 * read as one family instead of whether one looks right.
 */
export const AllVariants: Story = {
  render: function AllVariantsStory(args) {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {(["neutral", "success", "warning", "danger"] as const).map((variant) => (
          <Toast
            key={variant}
            {...args}
            variant={variant}
            open={open}
            onDismiss={() => setOpen(false)}
          >
            {variant === "neutral" && "Changes saved"}
            {variant === "success" && "Deployment finished in 42s"}
            {variant === "warning" && "Storage is 90% full"}
            {variant === "danger" && "Connection lost — retrying"}
          </Toast>
        ))}
      </div>
    )
  },
}

/**
 * `duration: 0` never expires — the toast stays until the reader dismisses
 * it, for messages that must not vanish before they are read.
 */
export const Persistent: Story = {
  args: { variant: "warning", duration: 0, children: "Session expires in 5 minutes" },
  render: function PersistentStory(args) {
    const [open, setOpen] = useState(true)
    return <Toast {...args} open={open} onDismiss={() => setOpen(false)} />
  },
}

/**
 * A long message. The toast must wrap or grow without clipping its close
 * button, which is the failure a short-message-only set never shows.
 */
export const LongMessage: Story = {
  args: {
    variant: "neutral",
    children:
      "Your workspace was migrated to the new region. Redirects are in place for thirty days, but integrations pointing at the old endpoint should be updated before then — see the migration guide for the exact steps per client.",
  },
  render: function LongMessageStory(args) {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ maxWidth: "26rem" }}>
        <Toast {...args} open={open} onDismiss={() => setOpen(false)} />
      </div>
    )
  },
}
