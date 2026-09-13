import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { makeNotification } from "@/test/factories"
import { render, screen } from "@/test/render"
import NotificationListItem, { type NotificationListItemProps } from "./NotificationListItem"

// `role` here is the component's own `DashboardRole` prop, not an ARIA role - spreading via a
// props object (rather than a literal `role="..."` JSX attribute) keeps Biome's
// `lint/a11y/useValidAriaRole` from misreading it as one.
function renderItem(props: NotificationListItemProps) {
  return render(<NotificationListItem {...props} />)
}

describe("NotificationListItem", () => {
  it("renders the unread dot, bold title and sr-only prefix in compact variant", () => {
    const notification = makeNotification({ read: false, title: "New order" })
    const { container } = renderItem({ notification, role: "buyer", variant: "compact" })

    const item = screen.getByTestId("notification-item")
    expect(item).toHaveAttribute("data-unread", "true")
    expect(container.querySelector("span.bg-brand")).toBeInTheDocument()
    expect(screen.getByText("Unread:")).toBeInTheDocument()
    expect(screen.getByText("New order").className).toContain("font-semibold")
  })

  it("renders no unread dot when read", () => {
    const notification = makeNotification({ read: true, title: "Old order" })
    const { container } = renderItem({ notification, role: "buyer", variant: "compact" })

    expect(screen.getByTestId("notification-item")).toHaveAttribute("data-unread", "false")
    expect(container.querySelector("span.bg-brand")).not.toBeInTheDocument()
    expect(screen.queryByText("Unread:")).not.toBeInTheDocument()
  })

  it("resolves the vendor Uber Direct notification to the vendor orders page", () => {
    const notification = makeNotification({ type: "VENDOR_WAITING_FOR_UBER_DIRECT" })
    renderItem({ notification, role: "vendor", variant: "compact" })

    expect(screen.getByRole("link")).toHaveAttribute("href", "/vendor-dashboard/orders")
  })

  it("resolves to the buyer notifications page for a buyer", () => {
    const notification = makeNotification({ type: "VENDOR_WAITING_FOR_UBER_DIRECT" })
    renderItem({ notification, role: "buyer", variant: "compact" })

    expect(screen.getByRole("link")).toHaveAttribute("href", "/buyer-dashboard/notifications")
  })

  it("calls onNavigate when the link is clicked", async () => {
    const user = userEvent.setup()
    const notification = makeNotification()
    const onNavigate = vi.fn()
    renderItem({ notification, role: "buyer", variant: "compact", onNavigate })

    await user.click(screen.getByRole("link"))
    expect(onNavigate).toHaveBeenCalledWith(notification)
  })

  it("does not render a toggle button in compact variant even when onToggleRead is provided", () => {
    const notification = makeNotification()
    renderItem({ notification, role: "buyer", variant: "compact", onToggleRead: vi.fn() })

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("does not render a toggle button in full variant unless onToggleRead is provided", () => {
    const notification = makeNotification()
    renderItem({ notification, role: "buyer", variant: "full" })

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders a mark-as-read toggle for an unread item in full variant", async () => {
    const user = userEvent.setup()
    const notification = makeNotification({ read: false })
    const onToggleRead = vi.fn()
    renderItem({ notification, role: "buyer", variant: "full", onToggleRead })

    const button = screen.getByRole("button", { name: "Mark as read" })
    await user.click(button)
    expect(onToggleRead).toHaveBeenCalledWith(notification)
  })

  it("renders a mark-as-unread toggle for a read item in full variant", () => {
    const notification = makeNotification({ read: true })
    renderItem({ notification, role: "buyer", variant: "full", onToggleRead: vi.fn() })

    expect(screen.getByRole("button", { name: "Mark as unread" })).toBeInTheDocument()
  })

  it("disables the toggle button while toggling", () => {
    const notification = makeNotification({ read: false })
    renderItem({ notification, role: "buyer", variant: "full", onToggleRead: vi.fn(), isToggling: true })

    expect(screen.getByRole("button", { name: "Mark as read" })).toBeDisabled()
  })
})
