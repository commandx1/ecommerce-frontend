import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"
import { useBuyerOrdersPage } from "./use-buyer-orders-page"

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockGetBuyerOrders = vi.fn()
const mockCancelDuringDeliveryByCustomer = vi.fn()
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
const mockAddToCart = vi.fn()
const mockExtractErrorStatus = vi.fn()
const mockIsAuthErrorStatus = vi.fn()
const mockIsAuthHandledError = vi.fn()

let mockIsAuthenticated = true
let mockSearchParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
  usePathname: () => "/buyer-dashboard/orders",
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

vi.mock("@/lib/api/buyer-orders", () => ({
  buyerOrdersAPI: {
    getBuyerOrders: (...args: unknown[]) => mockGetBuyerOrders(...args),
    cancelDuringDeliveryByCustomer: (...args: unknown[]) => mockCancelDuringDeliveryByCustomer(...args),
  },
}))

vi.mock("@/lib/api/auth-error", () => ({
  extractErrorStatus: (...args: unknown[]) => mockExtractErrorStatus(...args),
  isAuthErrorStatus: (...args: unknown[]) => mockIsAuthErrorStatus(...args),
  isAuthHandledError: (...args: unknown[]) => mockIsAuthHandledError(...args),
}))

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ isAuthenticated: mockIsAuthenticated }),
}))

vi.mock("@/features/cart/api/cart-queries", () => ({
  cartCommands: { addItem: (...args: unknown[]) => mockAddToCart(...args) },
}))

const baseOrder: BuyerOrder = {
  orderId: "order-1",
  totalPrice: 120,
  orderStatus: "PAID",
  createdDate: "2026-05-20T10:30:00Z",
  addressTitle: "Home",
  addressFormattedAddress: "Address",
  shipmentAddress: {
    title: "Home",
    fullName: "Jane Doe",
    phoneNumber: "5551234567",
    country: "TR",
    city: "Istanbul",
    district: "Kadikoy",
    postalCode: "34000",
    addressLine: "Street 1",
    formattedAddress: "Street 1",
    latitude: 0,
    longitude: 0,
    placeId: "p1",
  },
  sellerGroups: [
    {
      sellerId: "seller-1",
      sellerName: "Acme",
      sellerSurname: "Store",
      orderItems: [
        {
          id: "item-1",
          userProductId: "up-1",
          productId: "product-1",
          price: 100,
          quantity: 1,
          status: "WAITING_FOR_SHIPMENT",
          productName: "Dental Kit",
          productCoverPhotoPath: null,
          sellerName: "Acme",
          sellerSurname: "Store",
          updatedDate: "2026-05-20T11:00:00Z",
        },
      ],
    },
  ],
}

beforeEach(() => {
  mockIsAuthenticated = true
  mockSearchParams = new URLSearchParams()
  mockPush.mockReset()
  mockReplace.mockReset()
  mockGetBuyerOrders.mockReset()
  mockCancelDuringDeliveryByCustomer.mockReset()
  mockToastError.mockReset()
  mockToastSuccess.mockReset()
  mockAddToCart.mockReset()
  mockExtractErrorStatus.mockReset()
  mockIsAuthErrorStatus.mockReset()
  mockIsAuthHandledError.mockReset()

  mockExtractErrorStatus.mockReturnValue(500)
  mockIsAuthErrorStatus.mockReturnValue(false)
  mockIsAuthHandledError.mockReturnValue(false)
})

describe("useBuyerOrdersPage", () => {
  it("fetches orders and exposes computed table data", async () => {
    mockGetBuyerOrders.mockResolvedValue({
      orders: [baseOrder],
      totalPages: 3,
      totalElements: 25,
    })

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // The 6th argument is the AbortSignal the hook uses to cancel in-flight fetches; the 7th is
    // the optional orderId (undefined here, since the URL carries none).
    expect(mockGetBuyerOrders).toHaveBeenCalledWith(
      0,
      10,
      "createdDate",
      "desc",
      "ALL",
      expect.any(AbortSignal),
      undefined,
    )
    expect(result.current.filteredOrders).toHaveLength(1)
    expect(result.current.totalPages).toBe(3)
    expect(result.current.totalElements).toBe(25)
  })

  it("handles empty successful payload with zero pagination values", async () => {
    mockGetBuyerOrders.mockResolvedValue({
      orders: [],
      totalPages: 0,
      totalElements: 0,
    })

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.filteredOrders).toHaveLength(0)
    expect(result.current.totalPages).toBe(0)
    expect(result.current.totalElements).toBe(0)
  })

  // C axis: a malformed 200 body (e.g. an upstream proxy/cache serving a stale or
  // truncated shape) must not white-screen the page. Regression for the F77-style
  // bug where `setOrders(response.orders)` was unguarded - see TEST-FINDINGS.md F77.
  it.each([
    { name: "orders field missing entirely", body: {} },
    { name: "orders is null", body: { orders: null, totalPages: null, totalElements: null } },
    { name: "orders is a non-array object", body: { orders: {}, totalPages: "3", totalElements: "25" } },
  ])("survives a 200 response where $name", async ({ body }) => {
    mockGetBuyerOrders.mockResolvedValue(body)

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.filteredOrders).toEqual([])
    expect(result.current.totalPages).toBe(0)
    expect(result.current.totalElements).toBe(0)
  })

  it("shows toast and clears list when fetch fails", async () => {
    mockGetBuyerOrders.mockRejectedValue(new Error("network"))

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.filteredOrders).toHaveLength(0)
    expect(result.current.totalPages).toBe(0)
    expect(result.current.totalElements).toBe(0)
    expect(mockToastError).toHaveBeenCalledWith(
      "Orders unavailable",
      "Your orders could not be loaded right now. Please try again.",
    )
  })

  it("handles reorder success and auth failure flows", async () => {
    mockGetBuyerOrders.mockResolvedValue({
      orders: [baseOrder],
      totalPages: 1,
      totalElements: 1,
    })

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockAddToCart.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.handleReorder("up-1", 2, "Dental Kit")
    })

    expect(mockToastSuccess).toHaveBeenCalledWith("Added to cart", "Dental Kit was added to your cart.")

    const authError = new Error("auth")
    mockAddToCart.mockRejectedValueOnce(authError)
    mockExtractErrorStatus.mockReturnValueOnce(401)
    mockIsAuthErrorStatus.mockReturnValueOnce(true)

    await act(async () => {
      await result.current.handleReorder("up-1", 2, "Dental Kit")
    })

    expect(mockToastError).toHaveBeenCalledWith("Authentication required", "Please sign in to reorder items.")
    expect(mockPush).toHaveBeenCalledWith("/login")
  })

  it("confirms pending cancel action and updates order item status", async () => {
    mockGetBuyerOrders.mockResolvedValue({
      orders: [baseOrder],
      totalPages: 1,
      totalElements: 1,
    })

    mockCancelDuringDeliveryByCustomer.mockResolvedValue({
      message: "done",
      cancelledOrderItemIds: ["item-1"],
    })

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.requestCancelAction({
        orderItemIds: ["item-1"],
        description: "fallback",
        options: { cancelingItemId: "item-1" },
      })
    })

    await act(async () => {
      await result.current.confirmPendingCancelAction()
    })

    expect(mockCancelDuringDeliveryByCustomer).toHaveBeenCalledWith({ orderItemIds: ["item-1"] })
    expect(mockToastSuccess).toHaveBeenCalledWith("Cancellation sent", "done")
    expect(result.current.pendingCancelAction).toBeNull()
    expect(result.current.cancelingItemId).toBeNull()

    const updatedOrder = result.current.filteredOrders[0]
    expect(updatedOrder.sellerGroups?.[0]?.orderItems[0]?.status).toBe(OrderItemStatus.CANCEL_REQUESTED)
  })

  // C axis: `cancelledOrderItemIds` is a backend List<UUID> - a nullable Java reference,
  // not a DB-constrained column. A response missing it must not crash the item-status
  // update (same failure class as the vendor-side F79 fix in TEST-FINDINGS.md).
  it.each([
    { name: "cancelledOrderItemIds missing", response: { message: "done" } },
    { name: "cancelledOrderItemIds is null", response: { message: "done", cancelledOrderItemIds: null } },
  ])("survives a cancel response where $name", async ({ response }) => {
    mockGetBuyerOrders.mockResolvedValue({
      orders: [baseOrder],
      totalPages: 1,
      totalElements: 1,
    })
    mockCancelDuringDeliveryByCustomer.mockResolvedValue(response)

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.requestCancelAction({
        orderItemIds: ["item-1"],
        description: "fallback",
        options: { cancelingItemId: "item-1" },
      })
    })

    await act(async () => {
      await result.current.confirmPendingCancelAction()
    })

    expect(mockToastSuccess).toHaveBeenCalledWith("Cancellation sent", "done")
    const updatedOrder = result.current.filteredOrders[0]
    // No item should be flipped to CANCEL_REQUESTED since the response carried no ids -
    // the point is that reading it doesn't throw, not that anything gets marked cancelled.
    expect(updatedOrder.sellerGroups?.[0]?.orderItems[0]?.status).toBe("WAITING_FOR_SHIPMENT")
  })

  it("keeps single-expand behavior by switching to the latest expanded row", async () => {
    mockGetBuyerOrders.mockResolvedValue({
      orders: [baseOrder],
      totalPages: 1,
      totalElements: 1,
    })

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.handleExpandedChange({ "order-1": true })
    })
    expect(result.current.expandedState).toEqual({ "order-1": true })

    act(() => {
      result.current.handleExpandedChange((old) => ({ ...(old as Record<string, boolean>), "order-2": true }))
    })
    expect(result.current.expandedState).toEqual({ "order-2": true })

    act(() => {
      result.current.handleExpandedChange({})
    })
    expect(result.current.expandedState).toEqual({})
  })

  it("passes a valid orderId to the API and expands it, but drops an invalid one", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 1, totalElements: 1 })
    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111")

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetBuyerOrders).toHaveBeenLastCalledWith(
      0,
      10,
      "createdDate",
      "desc",
      "ALL",
      expect.any(AbortSignal),
      "11111111-1111-1111-1111-111111111111",
    )
    expect(result.current.expandedState).toEqual({ "11111111-1111-1111-1111-111111111111": true })

    mockGetBuyerOrders.mockClear()
    mockSearchParams = new URLSearchParams("orderId=garbage")

    const { result: resultWithGarbage } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(resultWithGarbage.current.isLoading).toBe(false)
    })

    expect(mockGetBuyerOrders).toHaveBeenLastCalledWith(
      0,
      10,
      "createdDate",
      "desc",
      "ALL",
      expect.any(AbortSignal),
      undefined,
    )
  })

  it("lowercases an UPPERCASE orderId before sending it and exposing it as singleOrderId", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 1, totalElements: 1 })
    mockSearchParams = new URLSearchParams(`orderId=${"11111111-1111-1111-1111-111111111111".toUpperCase()}`)

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.singleOrderId).toBe("11111111-1111-1111-1111-111111111111")
    expect(mockGetBuyerOrders).toHaveBeenLastCalledWith(
      0,
      10,
      "createdDate",
      "desc",
      "ALL",
      expect.any(AbortSignal),
      "11111111-1111-1111-1111-111111111111",
    )
  })

  // F1: a notification link can arrive while the shopper is deep in pagination. The stale
  // page must not ride along once the single-order view kicks in (DashboardPagination would
  // otherwise print a nonsensical "Showing 31 to 1 of 1 results").
  it("resets to page 0 once an orderId appears in the URL while on a later page", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 5, totalElements: 50 })

    const { result, rerender } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.handlePageChange(2)
    })

    await waitFor(() => {
      expect(mockGetBuyerOrders).toHaveBeenLastCalledWith(
        2,
        10,
        "createdDate",
        "desc",
        "ALL",
        expect.any(AbortSignal),
        undefined,
      )
    })

    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111")
    rerender()

    await waitFor(() => {
      expect(mockGetBuyerOrders).toHaveBeenLastCalledWith(
        0,
        10,
        "createdDate",
        "desc",
        "ALL",
        expect.any(AbortSignal),
        "11111111-1111-1111-1111-111111111111",
      )
    })
    expect(result.current.currentPage).toBe(0)
    // Exactly one filtered request: the page is derived, so there is no stale-page request to abort and re-send.
    expect(mockGetBuyerOrders.mock.calls.filter((call) => call[6] !== undefined).map((call) => call[0])).toEqual([0])
  })

  it("re-fetches and expands the new order when the orderId in the URL changes from A to B", async () => {
    const orderA = "11111111-1111-1111-1111-111111111111"
    const orderB = "22222222-2222-2222-2222-222222222222"
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 1, totalElements: 1 })
    mockSearchParams = new URLSearchParams(`orderId=${orderA}`)

    const { result, rerender } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.singleOrderId).toBe(orderA)
    })
    expect(result.current.expandedState).toEqual({ [orderA]: true })

    mockSearchParams = new URLSearchParams(`orderId=${orderB}`)
    rerender()

    await waitFor(() => {
      expect(result.current.singleOrderId).toBe(orderB)
    })
    expect(result.current.expandedState).toEqual({ [orderB]: true })
    expect(mockGetBuyerOrders).toHaveBeenLastCalledWith(
      0,
      10,
      "createdDate",
      "desc",
      "ALL",
      expect.any(AbortSignal),
      orderB,
    )
  })

  it("replaces the URL with the new selectedTab, no orderId, keeping other params on tab change", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 1, totalElements: 1 })
    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111&foo=bar")

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.handleTabChange("Delivered")
    })

    const replacedUrl = mockReplace.mock.calls[0]?.[0] as string
    const params = new URL(replacedUrl, "http://localhost").searchParams
    expect(params.get("selectedTab")).toBe("Delivered")
    expect(params.has("orderId")).toBe(false)
    expect(params.get("foo")).toBe("bar")
  })

  it("clears only the orderId param, keeping the rest, when clearSingleOrder is called", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 1, totalElements: 1 })
    mockSearchParams = new URLSearchParams("selectedTab=Delivered&orderId=11111111-1111-1111-1111-111111111111")

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.clearSingleOrder()
    })

    expect(mockReplace).toHaveBeenCalledWith("/buyer-dashboard/orders?selectedTab=Delivered", { scroll: false })
  })

  it("replaces to exactly the pathname, with no trailing '?', when orderId was the only param", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [baseOrder], totalPages: 1, totalElements: 1 })
    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111")

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.clearSingleOrder()
    })

    expect(mockReplace).toHaveBeenCalledWith("/buyer-dashboard/orders", { scroll: false })
  })

  it("shows no error toast when orderId points at someone else's order (empty, ownership-checked result)", async () => {
    mockGetBuyerOrders.mockResolvedValue({ orders: [], totalPages: 0, totalElements: 0 })
    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111")

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.filteredOrders).toHaveLength(0)
    expect(result.current.singleOrderId).toBe("11111111-1111-1111-1111-111111111111")
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("shows an error toast and clears the list when the fetch rejects while an orderId is set", async () => {
    mockGetBuyerOrders.mockRejectedValue(new Error("network"))
    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111")

    const { result } = renderHook(() => useBuyerOrdersPage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.filteredOrders).toHaveLength(0)
    expect(mockToastError).toHaveBeenCalledWith(
      "Orders unavailable",
      "Your orders could not be loaded right now. Please try again.",
    )
  })

  it("never calls the API when unauthenticated, even with a valid orderId in the URL", async () => {
    mockIsAuthenticated = false
    mockSearchParams = new URLSearchParams("orderId=11111111-1111-1111-1111-111111111111")

    renderHook(() => useBuyerOrdersPage())

    expect(mockGetBuyerOrders).not.toHaveBeenCalled()
  })
})
