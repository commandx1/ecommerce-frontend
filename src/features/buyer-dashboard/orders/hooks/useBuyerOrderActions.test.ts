import { QueryClient } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OrderItemStatus } from "@/lib/constants/order-item-status"
import type { BuyerOrderListParams } from "@/lib/query/keys"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { makeBuyerOrder, makeBuyerOrderItem } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import type { BuyerOrdersListResult } from "../api/orders-queries"
import { useBuyerOrderActions } from "./useBuyerOrderActions"

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
const mockPush = vi.fn()
const mockAddToCart = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/features/cart/api/cart-queries", () => ({
  cartCommands: { addItem: (...args: unknown[]) => mockAddToCart(...args) },
}))

// A real 401 through `apiClient` always sets `authHandled: true` (client.ts's interceptor), so
// `isAuthErrorStatus`'s "show a toast and redirect" branch below it is unreachable with a real
// response. Mocking this module (same as the pre-migration oracle test) lets these two specific
// branches be exercised deterministically, same as every other buyer-orders write action test.
const mockExtractErrorStatus = vi.fn()
const mockIsAuthErrorStatus = vi.fn()
const mockIsAuthHandledError = vi.fn()

vi.mock("@/lib/api/auth-error", () => ({
  extractErrorStatus: (...args: unknown[]) => mockExtractErrorStatus(...args),
  isAuthErrorStatus: (...args: unknown[]) => mockIsAuthErrorStatus(...args),
  isAuthHandledError: (...args: unknown[]) => mockIsAuthHandledError(...args),
}))

/** `createQueryWrapper()`'s default test client uses `gcTime: 0` for parity with production -
 * fine for a `useQuery`-backed hook where an active observer keeps the entry alive, but this
 * hook only ever reads/writes the cache imperatively (no observer), so a seeded entry would be
 * garbage-collected before the write under test ever runs. A longer `gcTime` here only affects
 * the test's own seed-then-patch setup, not the hook's behaviour. */
const createSeedableClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000, staleTime: 0 } } })

const params: BuyerOrderListParams = {
  page: 0,
  size: 10,
  sortBy: "createdDate",
  sortDir: "desc",
  type: "ALL",
  orderId: null,
}

describe("useBuyerOrderActions", () => {
  beforeEach(() => {
    mockToastError.mockReset()
    mockToastSuccess.mockReset()
    mockPush.mockReset()
    mockAddToCart.mockReset()
    mockExtractErrorStatus.mockReset()
    mockIsAuthErrorStatus.mockReset()
    mockIsAuthHandledError.mockReset()
    mockExtractErrorStatus.mockReturnValue(500)
    mockIsAuthErrorStatus.mockReturnValue(false)
    mockIsAuthHandledError.mockReturnValue(false)
  })

  describe("handleReorder", () => {
    it("adds the item to the cart and shows a success toast", async () => {
      mockAddToCart.mockResolvedValueOnce(undefined)
      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper: createQueryWrapper().wrapper })

      await act(async () => {
        await result.current.handleReorder("up-1", 2, "Dental Kit")
      })

      expect(mockAddToCart).toHaveBeenCalledWith("up-1", 2)
      expect(mockToastSuccess).toHaveBeenCalledWith("Added to cart", "Dental Kit was added to your cart.")
      expect(result.current.reorderingItemId).toBeNull()
    })

    it("redirects to login on an auth failure and does not show the generic failure toast", async () => {
      mockAddToCart.mockRejectedValueOnce(new Error("auth"))
      mockExtractErrorStatus.mockReturnValueOnce(401)
      mockIsAuthErrorStatus.mockReturnValueOnce(true)
      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper: createQueryWrapper().wrapper })

      await act(async () => {
        await result.current.handleReorder("up-1", 2, "Dental Kit")
      })

      expect(mockToastError).toHaveBeenCalledWith("Authentication required", "Please sign in to reorder items.")
      expect(mockPush).toHaveBeenCalledWith("/login")
      expect(mockToastSuccess).not.toHaveBeenCalled()
    })
  })

  describe("confirmPendingCancelAction", () => {
    it("patches the current list's cache entry with no GET, and shows a success toast", async () => {
      let cancelPostCount = 0
      server.use(
        http.post("*/backend-api/orders/cancelDuringDeliveryByCustomer", () => {
          cancelPostCount += 1
          return HttpResponse.json({
            message: "done",
            successCount: 1,
            failureCount: 0,
            cancelledOrderItemIds: ["item-1"],
          })
        }),
      )

      const { client, wrapper } = createQueryWrapper(createSeedableClient())
      const seededOrder = makeBuyerOrder({ orderItems: [makeBuyerOrderItem({ id: "item-1" })] })
      const seeded: BuyerOrdersListResult = { orders: [seededOrder], totalPages: 1, totalElements: 1 }
      client.setQueryData(queryKeys.orders.list(params), seeded)

      let getCount = 0
      server.use(
        http.get("*/backend-api/orders/buyer", () => {
          getCount += 1
          return HttpResponse.json({ orders: [], totalPages: 0, totalElements: 0 })
        }),
      )

      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper })

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

      expect(cancelPostCount).toBe(1)
      expect(getCount).toBe(0)
      expect(mockToastSuccess).toHaveBeenCalledWith("Cancellation sent", "done")
      expect(result.current.pendingCancelAction).toBeNull()
      expect(result.current.cancelingItemId).toBeNull()

      const patched = client.getQueryData<BuyerOrdersListResult>(queryKeys.orders.list(params))
      expect(patched?.orders[0]?.orderItems?.[0]?.status).toBe(OrderItemStatus.CANCEL_REQUESTED)
    })

    it("shows an auth-required toast and redirects on a 401", async () => {
      server.use(
        http.post("*/backend-api/orders/cancelDuringDeliveryByCustomer", () =>
          HttpResponse.json({ message: "expired" }, { status: 401 }),
        ),
      )
      mockExtractErrorStatus.mockReturnValue(401)
      mockIsAuthErrorStatus.mockReturnValue(true)

      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper: createQueryWrapper().wrapper })

      act(() => {
        result.current.requestCancelAction({ orderItemIds: ["item-1"], description: "fallback" })
      })
      await act(async () => {
        await result.current.confirmPendingCancelAction()
      })

      expect(mockToastError).toHaveBeenCalledWith("Authentication required", "expired")
      expect(mockPush).toHaveBeenCalledWith("/login")
    })
  })

  describe("requestRefundAction / submitRefundOrder", () => {
    it("does nothing when the item already has a returnDate", () => {
      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper: createQueryWrapper().wrapper })
      const order = makeBuyerOrder()
      const item = makeBuyerOrderItem({ returnDate: "2026-05-21T10:00:00Z" })

      act(() => {
        result.current.requestRefundAction(order, item)
      })

      expect(result.current.pendingRefundOrder).toBeNull()
    })

    it("patches the current list's cache entry with no GET, and shows a success toast", async () => {
      let refundPostCount = 0
      server.use(
        http.post("*/backend-api/orders/refundOrder", () => {
          refundPostCount += 1
          return HttpResponse.json({ message: "Return request sent", itemLinks: [] })
        }),
      )
      let getCount = 0
      server.use(
        http.get("*/backend-api/orders/buyer", () => {
          getCount += 1
          return HttpResponse.json({ orders: [], totalPages: 0, totalElements: 0 })
        }),
      )

      const { client, wrapper } = createQueryWrapper(createSeedableClient())
      const item = makeBuyerOrderItem({ id: "item-1" })
      const order = makeBuyerOrder({ orderId: "order-1", orderItems: [item] })
      const seeded: BuyerOrdersListResult = { orders: [order], totalPages: 1, totalElements: 1 }
      client.setQueryData(queryKeys.orders.list(params), seeded)

      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper })

      act(() => {
        result.current.requestRefundAction(order, item)
      })
      expect(result.current.pendingRefundOrder).not.toBeNull()

      await act(async () => {
        await result.current.submitRefundOrder({
          items: [{ orderItemId: "item-1", quantity: 1, returnReason: "DAMAGED" }],
        })
      })

      expect(refundPostCount).toBe(1)
      expect(getCount).toBe(0)
      expect(mockToastSuccess).toHaveBeenCalledWith("Return request sent", "Return request sent")
      expect(result.current.pendingRefundOrder).toBeNull()

      const patched = client.getQueryData<BuyerOrdersListResult>(queryKeys.orders.list(params))
      expect(patched?.orders[0]?.orderItems?.[0]?.returnRefundStatus).toBe("PENDING")
    })

    it("shows an auth-required toast and redirects on a 401", async () => {
      server.use(
        http.post("*/backend-api/orders/refundOrder", () => HttpResponse.json({ message: "expired" }, { status: 401 })),
      )
      mockExtractErrorStatus.mockReturnValue(401)
      mockIsAuthErrorStatus.mockReturnValue(true)

      const { result } = renderHook(() => useBuyerOrderActions(params), { wrapper: createQueryWrapper().wrapper })
      const item = makeBuyerOrderItem({ id: "item-1" })
      const order = makeBuyerOrder({ orderItems: [item] })

      act(() => {
        result.current.requestRefundAction(order, item)
      })
      await act(async () => {
        await result.current.submitRefundOrder({
          items: [{ orderItemId: "item-1", quantity: 1, returnReason: "DAMAGED" }],
        })
      })

      expect(mockToastError).toHaveBeenCalledWith("Authentication required", "expired")
      expect(mockPush).toHaveBeenCalledWith("/login")
    })
  })
})
