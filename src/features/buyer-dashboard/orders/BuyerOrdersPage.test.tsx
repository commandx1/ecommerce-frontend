import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BuyerOrdersPage from "./BuyerOrdersPage"

const mockUseBuyerOrdersAuthState = vi.fn()
const mockOrdersTable = vi.fn()
const mockOrdersMobileList = vi.fn()
const mockOrdersPagination = vi.fn()
const mockOrdersStatusTabs = vi.fn()
const mockCancelConfirmModal = vi.fn()
const mockRefundOrderModal = vi.fn()
const mockTrackingLinksModal = vi.fn()
const mockClearSingleOrder = vi.fn()

let mockSingleOrderId: string | null = null

vi.mock("./context/buyer-orders-context", () => ({
  BuyerOrdersProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useBuyerOrdersAuthState: () => mockUseBuyerOrdersAuthState(),
  useBuyerOrdersTabsState: () => ({ singleOrderId: mockSingleOrderId }),
  useBuyerOrdersTabsActions: () => ({ clearSingleOrder: mockClearSingleOrder }),
}))

vi.mock("./components/orders-table", () => ({
  default: () => {
    mockOrdersTable()
    return <div data-testid="orders-table" />
  },
}))

vi.mock("./components/orders-mobile-list", () => ({
  default: () => {
    mockOrdersMobileList()
    return <div data-testid="orders-mobile-list" />
  },
}))

vi.mock("./components/orders-pagination", () => ({
  default: () => {
    mockOrdersPagination()
    return <div data-testid="orders-pagination" />
  },
}))

vi.mock("./components/orders-status-tabs", () => ({
  default: () => {
    mockOrdersStatusTabs()
    return <div data-testid="orders-status-tabs" />
  },
}))

vi.mock("./components/cancel-confirm-modal", () => ({
  default: () => {
    mockCancelConfirmModal()
    return <div data-testid="cancel-confirm-modal" />
  },
}))

vi.mock("./components/refund-order-modal", () => ({
  default: () => {
    mockRefundOrderModal()
    return <div data-testid="refund-order-modal" />
  },
}))

vi.mock("./components/tracking-links-modal", () => ({
  default: () => {
    mockTrackingLinksModal()
    return <div data-testid="tracking-links-modal" />
  },
}))

beforeEach(() => {
  mockUseBuyerOrdersAuthState.mockReset()
  mockOrdersTable.mockReset()
  mockOrdersMobileList.mockReset()
  mockOrdersPagination.mockReset()
  mockOrdersStatusTabs.mockReset()
  mockCancelConfirmModal.mockReset()
  mockRefundOrderModal.mockReset()
  mockTrackingLinksModal.mockReset()
  mockClearSingleOrder.mockReset()
  mockSingleOrderId = null
})

describe("BuyerOrdersPage", () => {
  it("renders auth guard when user is not authenticated", () => {
    mockUseBuyerOrdersAuthState.mockReturnValue({ isAuthenticated: false })

    render(<BuyerOrdersPage />)

    expect(screen.getByText("Please log in to view your orders.")).toBeInTheDocument()
    expect(screen.queryByTestId("orders-table")).not.toBeInTheDocument()
  })

  it("renders page sections and child modules when authenticated", () => {
    mockUseBuyerOrdersAuthState.mockReturnValue({ isAuthenticated: true })

    render(<BuyerOrdersPage />)

    expect(screen.getByText("Your Orders")).toBeInTheDocument()
    expect(screen.getByTestId("orders-table")).toBeInTheDocument()
    expect(screen.getByTestId("orders-mobile-list")).toBeInTheDocument()
    expect(screen.getByTestId("orders-pagination")).toBeInTheDocument()
    expect(screen.getByTestId("orders-status-tabs")).toBeInTheDocument()
    expect(screen.getByTestId("cancel-confirm-modal")).toBeInTheDocument()
    expect(screen.getByTestId("refund-order-modal")).toBeInTheDocument()
    expect(screen.getByTestId("tracking-links-modal")).toBeInTheDocument()

    expect(mockOrdersTable).toHaveBeenCalledTimes(1)
    expect(mockOrdersMobileList).toHaveBeenCalledTimes(1)
    expect(mockOrdersPagination).toHaveBeenCalledTimes(1)
    expect(mockOrdersStatusTabs).toHaveBeenCalledTimes(1)
    expect(mockCancelConfirmModal).toHaveBeenCalledTimes(1)
    expect(mockRefundOrderModal).toHaveBeenCalledTimes(1)
    expect(mockTrackingLinksModal).toHaveBeenCalledTimes(1)
  })

  it("shows the single-order notice with a status role and a View all orders button when singleOrderId is set", () => {
    mockUseBuyerOrdersAuthState.mockReturnValue({ isAuthenticated: true })
    mockSingleOrderId = "11111111-1111-1111-1111-111111111111"

    render(<BuyerOrdersPage />)

    const notice = screen.getByRole("status")
    expect(notice).toHaveTextContent("Showing a single order from your notification.")
    const button = screen.getByRole("button", { name: "View all orders" })
    expect(button.tagName).toBe("BUTTON")
  })

  it("does not render the single-order notice when singleOrderId is null", () => {
    mockUseBuyerOrdersAuthState.mockReturnValue({ isAuthenticated: true })
    mockSingleOrderId = null

    render(<BuyerOrdersPage />)

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "View all orders" })).not.toBeInTheDocument()
  })

  it("calls clearSingleOrder exactly once when the View all orders button is clicked", async () => {
    const user = userEvent.setup()
    mockUseBuyerOrdersAuthState.mockReturnValue({ isAuthenticated: true })
    mockSingleOrderId = "11111111-1111-1111-1111-111111111111"

    render(<BuyerOrdersPage />)

    await user.click(screen.getByRole("button", { name: "View all orders" }))
    expect(mockClearSingleOrder).toHaveBeenCalledTimes(1)
  })

  it("lets the View all orders button be reached and activated by keyboard", async () => {
    const user = userEvent.setup()
    mockUseBuyerOrdersAuthState.mockReturnValue({ isAuthenticated: true })
    mockSingleOrderId = "11111111-1111-1111-1111-111111111111"

    render(<BuyerOrdersPage />)

    const button = screen.getByRole("button", { name: "View all orders" })
    for (let i = 0; i < 10 && document.activeElement !== button; i++) {
      await user.tab()
    }
    expect(button).toHaveFocus()

    await user.keyboard("{Enter}")
    expect(mockClearSingleOrder).toHaveBeenCalledTimes(1)
  })
})
