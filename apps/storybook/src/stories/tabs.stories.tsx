import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"
import { Tabs, TabsList, Tab, TabPanel } from "@santaka-ui/react"

/**
 * Stories for the compositional Tabs adapter.
 *
 * Same conventions as the Button reference story: imports come from
 * `@santaka-ui/react`, and every prop used is a real, typed prop of the
 * adapter. Composition follows the source: `TabsList` renders the
 * `slot="tablist"` the widget queries for, `Tab` carries the `label`, and
 * `TabPanel` is the authored panel shape. `active` is the controlled write —
 * omit it and the widget owns its own state; changes always arrive through
 * `onTabChange`.
 */
const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    active: {
      control: "number",
      description: "Controlled active tab index. Omit for the widget's own uncontrolled state.",
    },
    onTabChange: {
      action: "tab change",
      description: "Fires with the new index, subscribed via the custom event.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled: no `active` prop, so the widget owns its own state and
 * switches tabs internally.
 */
export const Uncontrolled: Story = {
  render: () => (
    <Tabs onTabChange={() => {}}>
      <TabsList>
        <Tab label="One" />
        <Tab label="Two" />
        <Tab label="Three" />
      </TabsList>
      <TabPanel>Panel one</TabPanel>
      <TabPanel>Panel two</TabPanel>
      <TabPanel>Panel three</TabPanel>
    </Tabs>
  ),
  /**
   * Interaction test (plan.md §10): selecting a tab moves `aria-selected` and
   * the visible panel. The widget owns its state here (no `active` prop), so
   * this proves the internal switch rather than a controlled write.
   */
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const second = await canvas.findByRole("tab", { name: "Two" })
    await userEvent.click(second)
    await expect(second).toHaveAttribute("aria-selected", "true")
    // The `aria-selected` write is imperative and lands synchronously; the
    // panel's `hidden` attribute is declarative, so it follows one render
    // later. Wait for it rather than sampling the intermediate frame.
    await waitFor(() => expect(canvas.getByText("Panel two")).toBeVisible())
  },
}

/**
 * Controlled: `active` pins the visible tab. `onTabChange` is logged by
 * Storybook's action, but the app decides whether to move — flip `active` in
 * the controls to see the write-side of the contract.
 */
export const Controlled: Story = {
  args: {
    active: 1,
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <Tab label="Alpha" />
        <Tab label="Beta" />
        <Tab label="Gamma" />
      </TabsList>
      <TabPanel>Alpha panel</TabPanel>
      <TabPanel>Beta panel</TabPanel>
      <TabPanel>Gamma panel</TabPanel>
    </Tabs>
  ),
}

/**
 * Real panel content: a set like a settings page would actually ship, with
 * headings, text, and different panel sizes.
 */
export const WithRealContent: Story = {
  render: () => (
    <Tabs onTabChange={() => {}}>
      <TabsList>
        <Tab label="Profile" />
        <Tab label="Notifications" />
        <Tab label="Billing" />
      </TabsList>
      <TabPanel>
        <div style={{ maxWidth: "32rem", display: "grid", gap: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>Profile</h3>
          <p style={{ margin: 0 }}>
            Your name, email, and avatar. Changes here are visible to everyone in your workspace.
          </p>
        </div>
      </TabPanel>
      <TabPanel>
        <div style={{ maxWidth: "32rem", display: "grid", gap: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>Notifications</h3>
          <p style={{ margin: 0 }}>
            Choose which events send email, which mention you, and which stay silent until you open
            the app.
          </p>
        </div>
      </TabPanel>
      <TabPanel>
        <div style={{ maxWidth: "32rem", display: "grid", gap: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>Billing</h3>
          <p style={{ margin: 0 }}>
            Invoices, payment methods, and plan changes. The panel is wider than the first one on
            purpose.
          </p>
        </div>
      </TabPanel>
    </Tabs>
  ),
}

/**
 * A very long label. The tab set must grow or truncate gracefully without
 * breaking the tablist layout or overlapping adjacent tabs.
 */
export const LongLabel: Story = {
  render: () => (
    <Tabs onTabChange={() => {}}>
      <TabsList>
        <Tab label="Overview" />
        <Tab label="Advanced experimental rendering pipeline settings" />
        <Tab label="About" />
      </TabsList>
      <TabPanel>Overview panel</TabPanel>
      <TabPanel>The long-label panel</TabPanel>
      <TabPanel>About panel</TabPanel>
    </Tabs>
  ),
}
