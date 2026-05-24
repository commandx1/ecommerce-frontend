import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BuyerOrdersPage from "./page"

const mockUseBuyerOrdersAuthState = vi.fn()
const mockOrdersTable = vi.fn()
const mockOrdersPagination = vi.fn()
const mockCancelConfirmModal = vi.fn()
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

vi.mock("./components/orders-pagination", () => ({
  default: () => {
    mockOrdersPagination()
    return <div data-testid="orders-pagination" />
  },
}))

vi.mock("./components/cancel-confirm-modal", () => ({
  default: () => {
    mockCancelConfirmModal()
    return <div data-testid="cancel-confirm-modal" />
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
  mockOrdersPagination.mockReset()
  mockCancelConfirmModal.mockReset()
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
    expect(screen.getByTestId("orders-pagination")).toBeInTheDocument()
    expect(screen.getByTestId("cancel-confirm-modal")).toBeInTheDocument()
    expect(screen.getByTestId("tracking-links-modal")).toBeInTheDocument()

    expect(mockOrdersTable).toHaveBeenCalledTimes(1)
    expect(mockOrdersPagination).toHaveBeenCalledTimes(1)
    expect(mockCancelConfirmModal).toHaveBeenCalledTimes(1)
    expect(mockTrackingLinksModal).toHaveBeenCalledTimes(1)
  })
})
