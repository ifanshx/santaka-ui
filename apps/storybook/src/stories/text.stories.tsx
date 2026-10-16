import type { Meta, StoryObj } from "@storybook/react-vite"
import { Text } from "@santaka-ui/react"

/**
 * Stories for the Text adapter. The adapter renders its child element verbatim
 * into the light DOM — there is no `as` prop, by design — so each story picks
 * the element that matches the semantics and lets `sk-text` set typography.
 */
const meta = {
  title: "Components/Text",
  component: Text,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "display-sm", "display"],
      description:
        "The type step, named exactly as the token is. Applies size, line-height, weight, and tracking as one record.",
    },
    family: {
      control: "inline-radio",
      options: ["inherit", "sans", "display", "mono"],
      description: "Which family to set. `inherit` (the default) leaves font-family alone.",
    },
    muted: {
      control: "boolean",
      description: "Secondary text color. The one color decision a text component owns.",
    },
  },
  args: {
    variant: "base",
    family: "inherit",
    muted: false,
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

/** The default: base step, inherited family, primary color. */
export const Base: Story = {}

/** Every type step in one story — the question a type-scale review asks. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {(
        ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "display-sm", "display"] as const
      ).map((v) => (
        <Text key={v} variant={v}>
          {v} — The quick brown fox jumps over the lazy dog
        </Text>
      ))}
    </div>
  ),
}

/** The families side by side; `inherit` is the default and shown first. */
export const Families: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <Text family="inherit">inherit — leaves font-family alone</Text>
      <Text family="sans">sans — the interface family</Text>
      <Text family="display">display — for headlines</Text>
      <Text family="mono">mono — for code and data</Text>
    </div>
  ),
}

/** `muted` drops to the secondary text color. */
export const Muted: Story = {
  args: {
    muted: true,
  },
}

/** Primary and muted side by side, to check the pairing reads correctly. */
export const MutedPairing: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.25rem" }}>
      <Text variant="lg">Workspace settings</Text>
      <Text muted>These settings apply to every member of the workspace, not just you.</Text>
    </div>
  ),
}

/**
 * The child element is rendered verbatim, so semantics stay with the element
 * the consumer chose — a real `<h2>` and `<p>`, not a prop-implied one.
 */
export const RealElements: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <Text variant="2xl" family="display">
        <h2 style={{ margin: 0 }}>Quarterly report</h2>
      </Text>
      <Text variant="base">
        <p style={{ margin: 0 }}>Revenue grew across all regions in the third quarter.</p>
      </Text>
    </div>
  ),
}
