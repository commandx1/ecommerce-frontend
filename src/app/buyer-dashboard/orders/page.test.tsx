import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BuyerOrdersPage from "./page"

const mockUseBuyerOrdersPage = vi.fn()
const mockOrdersTable = vi.fn()
const mockOrdersPagination = vi.fn()
const mockCancelConfirmModal = vi.fn()
const mockTrackingLinksModal = vi.fn()

vi.mock("./hooks/use-buyer-orders-page", () => ({
  useBuyerOrdersPage: () => mockUseBuyerOrdersPage(),
}))

vi.mock("./components/orders-table", () => ({
  default: (props: unknown) => {
    mockOrdersTable(props)
    return <div data-testid="orders-table" />
  },
}))

vi.mock("./components/orders-pagination", () => ({
  default: (props: unknown) => {
    mockOrdersPagination(props)
    return <div data-testid="orders-pagination" />
  },
}))

vi.mock("./components/cancel-confirm-modal", () => ({
  default: (props: { onConfirm: () => void; onClose: () => void }) => {
    mockCancelConfirmModal(props)
    return (
      <div>
        <button type="button" onClick={props.onConfirm}>
          fire-confirm
        </button>
        <button type="button" onClick={props.onClose}>
          fire-close
        </button>
      </div>
    )
  },
}))

vi.mock("./components/tracking-links-modal", () => ({
  default: (props: { onClose: () => void }) => {
    // This file verifies parent->child callback wiring only.
    // Real modal behavior is covered in tracking-links-modal.test.tsx.
    mockTrackingLinksModal(props)
    return (
      <button type="button" onClick={props.onClose}>
        fire-tracking-close
      </button>
    )
  },
}))

function createHookResult(overrides?: Partial<ReturnType<typeof mockUseBuyerOrdersPage>>) {
  return {
    cancelingItemId: null,
    cancelingSellerKey: null,
    confirmPendingCancelAction: vi.fn(),
    currentPage: 0,
    dateSortDir: "desc" as const,
    expandedState: {},
    filteredOrders: [],
    handleDateSortToggle: vi.fn(),
    handleExpandedChange: vi.fn(),
    handlePageChange: vi.fn(),
    handleReorder: vi.fn(),
    isAuthenticated: true,
    isConfirmingCancel: false,
    isLoading: false,
    pageSize: 10,
    pendingCancelAction: null,
    reorderingItemId: null,
    requestCancelAction: vi.fn(),
    setPendingCancelAction: vi.fn(),
    setTrackingModalLinks: vi.fn(),
    summariesByOrderId: new Map(),
    totalElements: 0,
    totalPages: 1,
    trackingModalLinks: null,
    ...overrides,
  }
}

beforeEach(() => {
  mockUseBuyerOrdersPage.mockReset()
  mockOrdersTable.mockReset()
  mockOrdersPagination.mockReset()
  mockCancelConfirmModal.mockReset()
  mockTrackingLinksModal.mockReset()
})

describe("BuyerOrdersPage", () => {
  it("renders auth guard when user is not authenticated", () => {
    mockUseBuyerOrdersPage.mockReturnValue(createHookResult({ isAuthenticated: false }))

    render(<BuyerOrdersPage />)

    expect(screen.getByText("Please log in to view your orders.")).toBeInTheDocument()
    expect(screen.queryByTestId("orders-table")).not.toBeInTheDocument()
  })

  it("renders page sections and passes state into child components", () => {
    const hookResult = createHookResult({
      filteredOrders: [{ orderId: "order-1" }],
      isLoading: true,
      totalPages: 5,
      totalElements: 42,
      currentPage: 2,
    })
    mockUseBuyerOrdersPage.mockReturnValue(hookResult)

    render(<BuyerOrdersPage />)

    expect(screen.getByText("Your Orders")).toBeInTheDocument()
    expect(screen.getByTestId("orders-table")).toBeInTheDocument()
    expect(screen.getByTestId("orders-pagination")).toBeInTheDocument()

    expect(mockOrdersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        orders: hookResult.filteredOrders,
        isLoading: true,
        onReorder: hookResult.handleReorder,
      }),
    )

    expect(mockOrdersPagination).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 2,
        totalPages: 5,
        totalElements: 42,
        onPageChange: hookResult.handlePageChange,
      }),
    )
  })

  it("wires modal callbacks to hook actions", async () => {
    const user = userEvent.setup()
    const hookResult = createHookResult()
    mockUseBuyerOrdersPage.mockReturnValue(hookResult)

    render(<BuyerOrdersPage />)

    await user.click(screen.getByRole("button", { name: "fire-confirm" }))
    await user.click(screen.getByRole("button", { name: "fire-close" }))
    await user.click(screen.getByRole("button", { name: "fire-tracking-close" }))

    expect(hookResult.confirmPendingCancelAction).toHaveBeenCalledTimes(1)
    expect(hookResult.setPendingCancelAction).toHaveBeenCalledWith(null)
    expect(hookResult.setTrackingModalLinks).toHaveBeenCalledWith(null)
  })
})
