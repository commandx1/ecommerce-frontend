import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import NotificationsTabs from "./NotificationsTabs"

describe("NotificationsTabs", () => {
  it("marks the active tab with aria-pressed", () => {
    render(<NotificationsTabs value="unread" onChange={vi.fn()} unreadCount={0} />)

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: /Unread/ })).toHaveAttribute("aria-pressed", "true")
  })

  it("calls onChange with the clicked tab", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NotificationsTabs value="all" onChange={onChange} unreadCount={0} />)

    await user.click(screen.getByRole("button", { name: /Unread/ }))

    expect(onChange).toHaveBeenCalledWith("unread")
  })

  it("shows the unread count badge only when greater than zero", () => {
    const { rerender } = render(<NotificationsTabs value="all" onChange={vi.fn()} unreadCount={0} />)

    expect(screen.queryByText("3")).not.toBeInTheDocument()

    rerender(<NotificationsTabs value="all" onChange={vi.fn()} unreadCount={3} />)

    expect(screen.getByText("3")).toBeInTheDocument()
  })
})
