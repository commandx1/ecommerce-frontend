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

  // BULGU: notification cards are plain <div>s — no role="alert"/"status", so nothing is
  // announced when one appears in response to a user action.
  it("exposes no live-region role for any tone (current behaviour)", () => {
    render(<NotificationCard tone="error" title="Something failed" description="Try again." />)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
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
