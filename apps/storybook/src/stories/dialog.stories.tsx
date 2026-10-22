import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, waitFor, within } from "storybook/test"
import { Button, Dialog, DialogContent, DialogTrigger } from "@santaka-ui/react"

/**
 * Dialog stories.
 *
 * Two conventions carried over from the Button reference:
 *
 * 1. The import is `@santaka-ui/react` — the published entry point.
 * 2. Every prop used is a real prop of the adapter: `open`, `modal`,
 *    `dismissible`, `label`, `onOpenChange` on `Dialog`; `title` on
 *    `DialogContent`. There is no `defaultOpen` — open/close is the
 *    component's own state, so uncontrolled stories rely on `DialogTrigger`,
 *    and controlled stories hold `open` in local state.
 */
const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controlled open state. Omit for uncontrolled; the trigger drives it.",
    },
    modal: {
      control: "boolean",
      description: "Non-modal renders inline without blocking the page.",
    },
    dismissible: {
      control: "boolean",
      description:
        "Closes when the backdrop is clicked. Off by default: dialogs holding form input lose work to a stray click.",
    },
    label: {
      control: "text",
      description: "Accessible name when no slotted heading exists.",
    },
    onOpenChange: {
      action: "open changed",
      description: "Fires for user interaction in both controlled and uncontrolled modes.",
    },
  },
  args: {
    modal: true,
    dismissible: false,
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The trigger-driven, uncontrolled case: no `open` prop at all — the
 * component owns its state and `DialogTrigger` toggles it.
 */
export const TriggerDriven: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent title="Confirm shipment">
        <p style={{ margin: "0 0 1rem" }}>
          The parcel leaves the warehouse tonight. Nothing here is editable after that.
        </p>
        <DialogTrigger>
          <Button>Close</Button>
        </DialogTrigger>
      </DialogContent>
    </Dialog>
  ),
  /**
   * Interaction test (docs/ARCHITECTURE.md §10): clicking the trigger opens the dialog, and
   * the panel is a real modal `<dialog>` in the document. This covers the
   * open path the component owns; the focus trap and dismissal rules are
   * proven in the browser suite (`packages/web-components/e2e/dialog.e2e.ts`).
   */
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const host = canvasElement.querySelector("sk-dialog")
    const trigger = await canvas.findByRole("button", { name: "Open dialog" })
    // Wait for the dialog itself, not just the trigger. The trigger is a
    // separate component (`sk-button`) that upgrades on its own schedule, so a
    // click can arrive before `sk-dialog` has hydrated and attached the
    // delegated click listener — a real, observed flake (it passed alone and
    // failed under `turbo run test`). `hydrated` is Stencil's own ready marker,
    // written after the component's lifecycle completes, so it is the signal
    // that means "this click will be heard".
    await waitFor(() => expect(host).toHaveClass("hydrated"))
    await userEvent.click(trigger)
    // The two facts that mean "open": the host reports its own state, and the
    // native panel carries the `open` attribute that shows it.
    await waitFor(() => expect(host).toHaveAttribute("data-state", "open"))
    await waitFor(() => expect(host?.querySelector("dialog")).toHaveAttribute("open"))
    // Deliberately not `toBeVisible()`. Stencil's scoped-mode slot manager
    // writes a stray `hidden` attribute onto the panel (it hosts `<slot>`
    // elements it built), and `sk-dialog.css` keeps the open panel visible
    // anyway via `[hidden][open] { display: flex }`. jest-dom treats `hidden`
    // as invisible regardless of computed style, so it would call a dialog the
    // user can plainly see "not visible". Real-browser visibility is asserted
    // where the model matches the pixels: `e2e/dialog.e2e.ts`.
  },
}

/**
 * Defaults to `open: true` so a reviewer sees the dialog without clicking.
 * Controlled: the local state follows `onOpenChange` back.
 */
export const ControlledOpen: Story = {
  args: { label: "Confirm shipment" },
  render: function ControlledOpenStory(args) {
    const [open, setOpen] = useState(true)
    return (
      <Dialog {...args} open={open} onOpenChange={setOpen}>
        <DialogContent title="Confirm shipment">
          <p style={{ margin: "0 0 1rem" }}>
            The parcel leaves the warehouse tonight. Nothing here is editable after that.
          </p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  },
}

/**
 * `modal: false` — the dialog renders inline without blocking the page,
 * so the surrounding content stays reachable while it is open.
 */
export const NonModal: Story = {
  args: { modal: false, label: "Draft saved" },
  render: function NonModalStory(args) {
    const [open, setOpen] = useState(true)
    return (
      <Dialog {...args} open={open} onOpenChange={setOpen}>
        <DialogContent title="Draft saved">
          <p style={{ margin: 0 }}>
            Your edits were kept. You can keep working while this notice is visible.
          </p>
        </DialogContent>
      </Dialog>
    )
  },
}

/**
 * `dismissible: true` — clicking the backdrop closes the dialog. Fine for
 * read-only content; never for a form holding unsaved input.
 */
export const Dismissible: Story = {
  args: { dismissible: true, label: "Keyboard shortcuts" },
  render: function DismissibleStory(args) {
    const [open, setOpen] = useState(true)
    return (
      <Dialog {...args} open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Keyboard shortcuts</Button>
        </DialogTrigger>
        <DialogContent title="Keyboard shortcuts">
          <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>
            <li>Ctrl+S — save</li>
            <li>Ctrl+K — command palette</li>
            <li>Esc — close this dialog</li>
          </ul>
          <p style={{ margin: 0 }}>This dialog also closes when you click the backdrop.</p>
        </DialogContent>
      </Dialog>
    )
  },
}

/**
 * A real form inside. `dismissible` stays off — a stray backdrop click must
 * not throw away half-completed input.
 */
export const WithForm: Story = {
  args: { label: "Invite teammate" },
  render: function WithFormStory(args) {
    const [open, setOpen] = useState(true)
    return (
      <Dialog {...args} open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Invite teammate</Button>
        </DialogTrigger>
        <DialogContent title="Invite teammate">
          <form
            style={{ display: "grid", gap: "0.75rem", minWidth: "22rem" }}
            onSubmit={(event) => {
              event.preventDefault()
              setOpen(false)
            }}
          >
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Email
              <input type="email" name="email" required placeholder="teammate@example.com" />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Role
              <select name="role" defaultValue="editor">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send invite</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
}
