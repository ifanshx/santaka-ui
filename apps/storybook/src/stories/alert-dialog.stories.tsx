import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { AlertDialog, AlertDialogContent, Button } from "@santaka-ui/react"

/**
 * AlertDialog stories.
 *
 * There is deliberately no trigger: an alert is raised by the application in
 * response to something, never opened by the user browsing. Every story here
 * holds `open` in local state driven by `onOpenChange` (the only way the
 * component reports a close), and at least one defaults to `open: true` so a
 * reviewer sees it without simulating an application event first.
 */
const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controlled open state; the application raises and resolves the alert.",
    },
    label: {
      control: "text",
      description: "Accessible name. An interruption that announces nothing is a modal mystery.",
    },
    initialFocus: {
      control: "text",
      description: "Selector for the control receiving initial focus — the default action.",
    },
    onOpenChange: {
      action: "open changed",
      description: "Fires on every close, which only ever follows a decision.",
    },
  },
  args: {
    label: "Delete project",
  },
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Destructive confirm, open by default. The cancel action is the safe
 * default: it gets focus first via `initialFocus`, so Enter or a hasty
 * Space press cannot destroy anything.
 */
export const DestructiveConfirm: Story = {
  args: { initialFocus: "#alert-cancel" },
  render: function DestructiveConfirmStory(args) {
    const [open, setOpen] = useState(true)
    const [deleted, setDeleted] = useState(false)
    return (
      <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
        <AlertDialog {...args} open={open} onOpenChange={setOpen}>
          <AlertDialogContent title="Delete project?">
            <p style={{ margin: "0 0 1rem" }}>
              “Aurora rebrand” and its 34 documents will be gone permanently. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button id="alert-cancel" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDeleted(true)
                  setOpen(false)
                }}
              >
                Delete project
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        {deleted ? <p style={{ margin: 0 }}>Project deleted.</p> : null}
      </div>
    )
  },
}

/**
 * The `initialFocus` case: focus lands on the confirm action instead of the
 * safe one, for flows where proceeding is the expected decision.
 */
export const InitialFocusOnConfirm: Story = {
  args: { label: "Publish changes", initialFocus: "#alert-confirm" },
  render: function InitialFocusStory(args) {
    const [open, setOpen] = useState(true)
    const [published, setPublished] = useState(false)
    return (
      <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
        <AlertDialog {...args} open={open} onOpenChange={setOpen}>
          <AlertDialogContent title="Publish changes?">
            <p style={{ margin: "0 0 1rem" }}>
              12 edited pages go live immediately. You can unpublish afterwards, but subscribers are
              notified on publish.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                id="alert-confirm"
                onClick={() => {
                  setPublished(true)
                  setOpen(false)
                }}
              >
                Publish
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        {published ? <p style={{ margin: 0 }}>Changes published.</p> : null}
      </div>
    )
  },
}

/**
 * The application-raised case, shown closed: the alert only appears after
 * the button simulates the app deciding an alert is needed.
 */
export const RaisedByApplication: Story = {
  args: { label: "Unsaved changes" },
  render: function RaisedStory(args) {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Discard draft (raises alert)
        </Button>
        <AlertDialog {...args} open={open} onOpenChange={setOpen}>
          <AlertDialogContent title="Discard unsaved changes?">
            <p style={{ margin: "0 0 1rem" }}>
              You have edits that were never saved. Discarding them cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Keep editing
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Discard
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  },
}
