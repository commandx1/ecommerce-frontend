import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import ConfirmationModal from "./ConfirmationModal"
import EmptyStateCard from "./EmptyStateCard"
import NoticeBanner from "./NoticeBanner"
import NotificationCard from "./NotificationCard"

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("NotificationCard", () => {
  it("renders its title and description", () => {
    render(<NotificationCard tone="error" title="Checkout is blocked" description="Remove 1 item." />)

    expect(screen.getByText("Checkout is blocked")).toBeInTheDocument()
    expect(screen.getByText("Remove 1 item.")).toBeInTheDocument()
  })

  it("renders children under the description", () => {
    render(
      <NotificationCard tone="warning" title="License required">
        <a href="/settings">Add your license</a>
      </NotificationCard>,
    )

    expect(screen.getByRole("link", { name: "Add your license" })).toBeInTheDocument()
  })

  it("accepts a caller-supplied icon in place of the tone icon", () => {
    render(<NotificationCard tone="info" title="Heads up" icon={<span data-testid="custom-icon" />} />)

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
  })

  it("announces error and warning tones assertively via role=alert", () => {
    const { unmount } = render(<NotificationCard tone="error" title="Something failed" description="Try again." />)
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed")
    unmount()

    render(<NotificationCard tone="warning" title="Heads up" description="Check this." />)
    expect(screen.getByRole("alert")).toHaveTextContent("Heads up")
  })

  it("announces info and success tones politely via role=status", () => {
    const { unmount } = render(<NotificationCard tone="info" title="FYI" description="Nothing urgent." />)
    expect(screen.getByRole("status")).toHaveTextContent("FYI")
    unmount()

    render(<NotificationCard tone="success" title="Saved" description="Your changes are live." />)
    expect(screen.getByRole("status")).toHaveTextContent("Saved")
  })
})

describe("NoticeBanner", () => {
  it("passes its content through to a notification card", () => {
    render(<NoticeBanner tone="success" title="Saved" description="Your changes are live." />)

    expect(screen.getByText("Saved")).toBeInTheDocument()
    expect(screen.getByText("Your changes are live.")).toBeInTheDocument()
  })
})

describe("EmptyStateCard", () => {
  it("shows the title and description", () => {
    render(<EmptyStateCard title="Your Cart is Empty" description="Add some products." />)

    expect(screen.getByRole("heading", { name: "Your Cart is Empty" })).toBeInTheDocument()
    expect(screen.getByText("Add some products.")).toBeInTheDocument()
  })

  // The card sits inside pages that already own an h1 (cart, auto-orders); rendering its own h1
  // gave those pages two top-level headings and broke the outline for screen-reader users.
  it("titles itself at h2 so it cannot compete with the page's own h1", () => {
    render(<EmptyStateCard title="Your Cart is Empty" description="Add some products." />)

    expect(screen.getByRole("heading", { name: "Your Cart is Empty", level: 2 })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("renders the action only when both a label and a handler are given", () => {
    render(<EmptyStateCard title="Empty" description="Nothing here." actionLabel="Continue" />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("invokes the action handler", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<EmptyStateCard title="Empty" description="Nothing here." actionLabel="Continue" onAction={onAction} />)

    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })
})

describe("ConfirmationModal", () => {
  const renderModal = (props: Partial<Parameters<typeof ConfirmationModal>[0]> = {}) => {
    const handlers = { onClose: vi.fn(), onConfirm: vi.fn() }
    render(
      <ConfirmationModal
        isOpen
        title="Clear cart?"
        description="All items will be removed."
        {...handlers}
        {...props}
      />,
    )
    return handlers
  }

  it("stays out of the DOM while closed", () => {
    renderModal({ isOpen: false })

    expect(screen.queryByText("All items will be removed.")).not.toBeInTheDocument()
  })

  // The dismiss control is an icon-only button; without an accessible name a screen-reader user
  // hears only "button" and has no way to know it closes the dialog.
  it("gives the icon-only dismiss control an accessible name that closes the dialog", async () => {
    const user = userEvent.setup()
    const handlers = renderModal()

    await user.click(screen.getByRole("button", { name: "Close" }))

    expect(handlers.onClose).toHaveBeenCalledTimes(1)
  })

  it("confirms and cancels through the two footer actions", async () => {
    const user = userEvent.setup()
    const handlers = renderModal({ confirmText: "Clear cart", cancelText: "Cancel" })

    await user.click(screen.getByRole("button", { name: "Clear cart" }))
    expect(handlers.onConfirm).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(handlers.onClose).toHaveBeenCalledTimes(1)
  })

  it("locks both actions and relabels the confirm button while working", () => {
    renderModal({ confirmText: "Clear cart", isLoading: true })

    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    const handlers = renderModal()

    await user.keyboard("{Escape}")

    expect(handlers.onClose).toHaveBeenCalled()
  })
})
