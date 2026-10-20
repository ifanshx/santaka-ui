import type { Meta, StoryObj } from "@storybook/react-vite"
import { Kbd } from "@santaka-ui/react"

/**
 * Stories for the Kbd adapter.
 *
 * The component has one look, so the controls are just `size` and the key text.
 * What the stories exist to show is the part a static screenshot cannot: that
 * the rendered element is a real `<kbd>`, and that a shortcut reads correctly
 * inside the sentence it describes.
 */
const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
      description: "The type step the shortcut is set in.",
    },
    children: { control: "text", description: "The key or key combination." },
  },
  args: {
    children: "Ctrl",
    size: "md",
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

/** The default: one modifier key at the medium step. */
export const Default: Story = {}

/** Both sizes side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <Kbd size="sm">Esc</Kbd>
      <Kbd size="md">Esc</Kbd>
    </div>
  ),
}

/**
 * A real combination, which is the shape shortcuts actually appear in. The keys
 * are separate elements with the `+` in the markup between them: the component
 * renders one key and adds no separator of its own.
 */
export const Combination: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
      <Kbd>Ctrl</Kbd>
      <span>+</span>
      <Kbd>Shift</Kbd>
      <span>+</span>
      <Kbd>K</Kbd>
    </div>
  ),
}

/**
 * Inline with copy. This is the case that catches a key box that forces its line
 * box open: a shortcut is read inside a sentence, not on a line of its own.
 */
export const InlineInSentence: Story = {
  render: () => (
    <p style={{ maxWidth: "34ch", lineHeight: 1.6 }}>
      Press <Kbd>Ctrl</Kbd> then <Kbd>K</Kbd> to open the command palette from anywhere in the
      application.
    </p>
  ),
}

/**
 * A long key name. The box must grow rather than clip, which a story showing
 * only single characters never exercises.
 */
export const LongKeyName: Story = {
  args: { children: "Command" },
}
