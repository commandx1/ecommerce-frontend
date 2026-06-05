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

vi.mock("next/navigation", () => ({
  usePathname: () => "/buyer-dashboard/orders",
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
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

vi.mock("@/stores/cartStore", () => ({
  useCartStore: (selector: (state: { addToCart: typeof mockAddToCart }) => unknown) =>
    selector({ addToCart: mockAddToCart }),
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

    expect(mockGetBuyerOrders).toHaveBeenCalledWith(0, 10, "createdDate", "desc", "ALL")
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
})
