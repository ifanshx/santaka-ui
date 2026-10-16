import type { Meta, StoryObj } from "@storybook/react-vite"
import { IconButton } from "@santaka-ui/react"

/**
 * Stories for the IconButton adapter.
 *
 * NOTE: `label` is a required prop on purpose. There is no visible text to
 * fall back on, so an icon-only control with no `label` has no accessible
 * name — the adapter's type makes that a compile error instead of a bug
 * report. Every story below supplies one.
 */
function Icon({ children }: { children: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children === "pencil" && (
        <path d="M11.3 1.7a1.5 1.5 0 0 1 2.1 2.1L4.5 12.7 1.5 13.5l.8-3L11.3 1.7z" />
      )}
      {children === "trash" && (
        <path d="M2.5 4h11M5.5 4V2.5h5V4M4 4l.7 9.5h6.6L12 4M6.5 6.5v5M9.5 6.5v5" />
      )}
      {children === "gear" && (
        <>
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
        </>
      )}
      {children === "plus" && <path d="M8 2v12M2 8h12" />}
      {children === "search" && (
        <>
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </>
      )}
    </svg>
  )
}

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "The accessible name. Required: there is no visible text to fall back on.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "danger"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
    type: {
      control: "inline-radio",
      options: ["button", "submit", "reset"],
      description: "Form semantics, forwarded to the underlying `<button>`.",
    },
    disabled: { control: "boolean" },
    loading: {
      control: "boolean",
      description: "Sets `aria-busy` and blocks activation while work is in flight.",
    },
    children: { control: false },
  },
  args: {
    label: "Edit",
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
  },
  render: (args) => (
    <IconButton {...args}>
      <Icon>pencil</Icon>
    </IconButton>
  ),
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

/** The default: primary, medium, enabled. */
export const Primary: Story = {}

export const Secondary: Story = { args: { variant: "secondary" } }
export const Outline: Story = { args: { variant: "outline" } }
export const Ghost: Story = { args: { variant: "ghost" } }
export const Danger: Story = {
  args: { variant: "danger", label: "Delete" },
  render: (args) => (
    <IconButton {...args}>
      <Icon>trash</Icon>
    </IconButton>
  ),
}

/** All five variants side by side, each with its own real icon and label. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <IconButton label="Add item" variant="primary">
        <Icon>plus</Icon>
      </IconButton>
      <IconButton label="Search" variant="secondary">
        <Icon>search</Icon>
      </IconButton>
      <IconButton label="Settings" variant="outline">
        <Icon>gear</Icon>
      </IconButton>
      <IconButton label="Edit" variant="ghost">
        <Icon>pencil</Icon>
      </IconButton>
      <IconButton label="Delete" variant="danger">
        <Icon>trash</Icon>
      </IconButton>
    </div>
  ),
}

/** All three sizes side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <IconButton label="Edit (small)" size="sm">
        <Icon>pencil</Icon>
      </IconButton>
      <IconButton label="Edit (medium)" size="md">
        <Icon>pencil</Icon>
      </IconButton>
      <IconButton label="Edit (large)" size="lg">
        <Icon>pencil</Icon>
      </IconButton>
    </div>
  ),
}

/** `disabled` is a real attribute; the control leaves the tab order. */
export const Disabled: Story = { args: { disabled: true } }

/** `loading` sets `aria-busy` and blocks activation — not just a spinner. */
export const Loading: Story = { args: { loading: true } }

/** A submit button inside forms. */
export const SubmitType: Story = { args: { type: "submit", label: "Submit form" } }
