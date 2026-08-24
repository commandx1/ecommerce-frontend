import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BuyerOrdersPage from "./page"

const mockUseBuyerOrdersAuthState = vi.fn()
const mockOrdersTable = vi.fn()
const mockOrdersMobileList = vi.fn()
const mockOrdersPagination = vi.fn()
const mockOrdersStatusTabs = vi.fn()
const mockCancelConfirmModal = vi.fn()
const mockRefundOrderModal = vi.fn()
const mockTrackingLinksModal = vi.fn()

vi.mock("./context/buyer-orders-context", () => ({
  BuyerOrdersProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useBuyerOrdersAuthState: () => mockUseBuyerOrdersAuthState(),
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
})
