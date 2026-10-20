import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor } from "storybook/test"
import { Button, Drawer } from "@santaka-ui/react"

/**
 * Stories for the Drawer adapter.
 *
 * The focus story is the dialog's — reused from `shared/dialog-base.ts` — so what
 * these show is the edge. `side` is logical: `start` and `end` mirror under
 * `dir="rtl"`.
 *
 * `slot="trigger"` goes on a plain element, not on the Button adapter: slot
 * assignment is the browser's, and a React component prop would not reach the
 * DOM attribute that does it. The same rule the Banner and Card stories follow.
 */
const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["start", "end"],
      description: 'Which edge. Logical, so it mirrors under dir="rtl".',
    },
    modal: { control: "boolean" },
    dismissible: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    side: "end",
    modal: true,
    dismissible: true,
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

/** Opens from the inline-end edge. Trigger and content are children. */
export const FromEnd: Story = {
  render: (args) => (
    <Drawer {...args} label="Settings">
      <span slot="trigger">
        <Button variant="secondary">Open drawer</Button>
      </span>
      <h3 slot="title">Settings</h3>
      <p>Slides in from the inline-end edge.</p>
    </Drawer>
  ),
  /**
   * Interaction test for the overlay story: the trigger opens the drawer, the
   * trigger's `aria-expanded` tracks it, and the close path leaves the panel
   * shut with the trigger reporting closed. Escape and focus return are
   * asserted against trusted keyboard input where they belong —
   * `packages/web-components/e2e/drawer.e2e.ts` — and the edge mechanics this
   * file is really about (which side the panel lands on, RTL mirroring) are
   * proven there too, where the pixels are real.
   */
  play: async ({ canvasElement, userEvent }) => {
    const host = canvasElement.querySelector("sk-drawer")
    // `hydrated` is Stencil's ready marker — a click before it is a click the
    // delegated listener never hears.
    await waitFor(() => expect(host).toHaveClass("hydrated"))
    const trigger = canvasElement.querySelector("[slot='trigger']") as HTMLElement
    // The element puts `aria-haspopup`/`aria-expanded` on the slotted trigger
    // itself, not the Button inside it: slot assignment is the browser's, so
    // this mirrors what `popover.e2e.ts` asserts against real Chromium.
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"))

    await userEvent.click(trigger)
    // The two facts that mean "open": the native `<dialog>` carries `open`,
    // and the trigger announces the state a screen reader reads.
    await waitFor(() => expect(host?.querySelector("dialog")).toHaveAttribute("open"))
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"))

    // Escape is the browser's close path, and the focus return below is what a
    // keyboard user actually feels. A synthetic `{Escape}` does not reach a native
    // `<dialog>` here — measured, the dialog stayed open — so this drives the
    // component's own `close()`, the path every dismissal takes. Key handling
    // itself is asserted against real Chromium in `drawer.e2e.ts`, where a real
    // key press is trustworthy.
    await (host as (HTMLElement & { close: () => Promise<void> }) | null)?.close()
    await waitFor(() => expect(host?.querySelector("dialog")).not.toHaveAttribute("open"))
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"))
    // Focus return is deliberately NOT asserted here. It is asserted against real
    // Chromium in `drawer.e2e.ts` ("Escape closes and focus returns to the
    // trigger"), where it passes. In this environment focus lands on `<body>`
    // after a close — measured, by two different close paths — and an assertion
    // that fails for an environment reason rather than a product reason is worse
    // than no assertion: it trains the next reader to ignore it.
  },
}

/** Opens from the inline-start edge — the same component, mirrored. */
export const FromStart: Story = {
  args: { side: "start" },
  render: (args) => (
    <Drawer {...args} label="Navigation">
      <span slot="trigger">
        <Button variant="ghost">Open from the other edge</Button>
      </span>
      <h3 slot="title">Navigation</h3>
      <p>Opens on the logical start edge.</p>
    </Drawer>
  ),
}

/**
 * Non-modal: the page behind stays interactive, for a side panel the reader keeps
 * open while working.
 */
export const NonModal: Story = {
  args: { modal: false },
  render: (args) => (
    <Drawer {...args} label="Filters">
      <span slot="trigger">
        <Button variant="outline">Keep it open</Button>
      </span>
      <h3 slot="title">Filters</h3>
      <p>A non-modal drawer does not trap focus or make the page inert.</p>
    </Drawer>
  ),
}
