import { expect, within } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Breadcrumb } from "@santaka-ui/react"

/**
 * Stories for the Breadcrumb adapter.
 *
 * The trail is an array rather than children: the element has to know which entry
 * is last, which is what `aria-current` hangs off.
 */
const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    items: [
      { label: "Home", href: "#" },
      { label: "Projects", href: "#" },
      { label: "Santaka", href: "#" },
      { label: "Components" },
    ],
  },
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

/** A four-level trail. The last entry is the current page, not a link. */
export const Default: Story = {}

/** A short trail. Two levels still say where you are. */
export const TwoLevels: Story = {
  args: {
    items: [{ label: "Home", href: "#" }, { label: "Components" }],
  },
}

/**
 * A deep trail, to show the row wraps rather than clipping — and that the
 * separators stay drawn, not typed.
 */
export const DeepTrail: Story = {
  args: {
    items: [
      { label: "Home", href: "#" },
      { label: "Organisation", href: "#" },
      { label: "Team", href: "#" },
      { label: "Project", href: "#" },
      { label: "Settings", href: "#" },
      { label: "Runners" },
    ],
  },
}

/**
 * The ARIA shape, exercised in the browser — the same contract the Playwright
 * suite asserts, phrased against the rendered adapter: a named landmark
 * wrapping one ordered list, `aria-current="page"` on the last item only, and
 * no link on it, because a link to the page you are on is a no-op that reads as
 * actionable.
 */
export const AccessibleTrail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // `findByRole`, not `getByRole`: the element upgrades asynchronously and
    // the landmark does not exist until it has.
    const nav = await canvas.findByRole("navigation", { name: "Breadcrumb" })
    expect(nav.querySelector("ol")).not.toBeNull()

    const items = Array.from(nav.querySelectorAll("li"))
    expect(items.length).toBe(4)
    const last = items[items.length - 1]!
    // Only the last item is current, and it is a span, not a link.
    expect(last.querySelector('[aria-current="page"]')).not.toBeNull()
    expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1)
    expect(last.querySelector("a")).toBeNull()

    // Everything before it is a destination, so it is a link.
    const first = items[0]
    expect(first).toBeDefined()
    expect(first?.querySelector("a")).not.toBeNull()
  },
}
