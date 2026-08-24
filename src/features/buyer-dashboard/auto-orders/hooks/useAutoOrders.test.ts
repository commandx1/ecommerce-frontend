import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SavedPaymentMethod } from "@/features/buyer-dashboard/payment-methods/paymentMethodsData"
import { addressAPI } from "@/lib/api/address"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"
import { server } from "@/mocks/server"
import { makeAddress, makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories"
import { useAutoOrders } from "./useAutoOrders"

const mockToastError = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const readyCard: SavedPaymentMethod = {
  id: "card-1",
  type: "visa",
  brandLabel: "Visa",
  nickname: "Auto order card",
  last4: "4242",
  cardholder: "Jane Doe",
  expiryMonth: "01",
  expiryYear: "2030",
  billingAddress: "201 Madison Ave, New York, NY",
  status: "default",
  stripePaymentMethodId: "pm_1",
  openToAutoPayment: true,
  autoOrderCard: true,
}

describe("useAutoOrders", () => {
  beforeEach(() => {
    mockToastError.mockReset()
    // `addressAPI.getAddresses` dedupes/caches at module scope; spying bypasses that cache so
    // every test gets exactly the response it configures instead of a stale one from a previous test.
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([])
  })

  it("loads auto orders on mount and turns off isLoading once settled", async () => {
    const order = makeAutoOrder()
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
    )

    const { result } = renderHook(() => useAutoOrders())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([order])
  })

  it("handles an empty auto-orders list", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ autoOrders: [], total: 0 })))

    const { result } = renderHook(() => useAutoOrders())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])
  })

  it("surfaces a toast and stops loading when the initial fetch fails", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    const { result } = renderHook(() => useAutoOrders())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])
    expect(mockToastError).toHaveBeenCalledWith("Failed to load auto orders", "boom")
  })

  it("readiness is not ready when there is no default address, even with a usable card", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: false })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([readyCard])
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders())

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.hasPrimaryAddress).toBe(false)
    expect(result.current.readiness.hasAutoOrderCard).toBe(true)
    expect(result.current.readiness.isReady).toBe(false)
  })

  it("readiness is not ready when the saved card is not open to automatic payment", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([{ ...readyCard, openToAutoPayment: false }])
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders())

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.hasAutoOrderCard).toBe(false)
    expect(result.current.readiness.isReady).toBe(false)
  })

  it("readiness is ready when a default address and a usable auto-order card both exist", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([readyCard])
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders())

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.isReady).toBe(true)
  })

  it("readiness tolerates the address/card lookups failing (treated as not-ready, not a crash)", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockRejectedValue(new Error("network down"))
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockRejectedValue(new Error("network down"))
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders())

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.isReady).toBe(false)
  })

  it("updateAutoOrder replaces the updated order in place and returns true on success", async () => {
    const order = makeAutoOrder({ id: "auto-1", quantity: 1 })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.patch("*/backend-api/auto-orders/:autoOrderId", ({ params }) =>
        HttpResponse.json(makeAutoOrder({ id: String(params.autoOrderId), quantity: 5 })),
      ),
    )

    const { result } = renderHook(() => useAutoOrders())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateAutoOrder("auto-1", { quantity: 5 })
    })

    expect(success).toBe(true)
    expect(result.current.autoOrders[0]?.quantity).toBe(5)
    expect(result.current.pendingId).toBeNull()
  })

  it("updateAutoOrder shows a toast, refreshes readiness, and returns false on a 400 (e.g. not ready to activate)", async () => {
    const order = makeAutoOrder({ id: "auto-1", active: false })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.patch("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json({ message: "A primary address and an auto order card are required." }, { status: 400 }),
      ),
    )
    const readinessSpy = vi.spyOn(addressAPI, "getAddresses")

    const { result } = renderHook(() => useAutoOrders())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    readinessSpy.mockClear()

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateAutoOrder("auto-1", { active: true })
    })

    expect(success).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith(
      "Could not update auto order",
      "A primary address and an auto order card are required.",
    )
    expect(result.current.autoOrders[0]?.active).toBe(false)
    expect(readinessSpy).toHaveBeenCalled()
  })

  it("deleteAutoOrder removes the order from the list and returns true on success", async () => {
    const order = makeAutoOrder({ id: "auto-1" })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.delete("*/backend-api/auto-orders/:autoOrderId", () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useAutoOrders())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.deleteAutoOrder("auto-1")
    })

    expect(success).toBe(true)
    expect(result.current.autoOrders).toEqual([])
  })

  it("deleteAutoOrder shows a toast and keeps the list unchanged on failure", async () => {
    const order = makeAutoOrder({ id: "auto-1" })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.delete("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json({ message: "Cannot delete an active auto order." }, { status: 409 }),
      ),
    )

    const { result } = renderHook(() => useAutoOrders())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.deleteAutoOrder("auto-1")
    })

    expect(success).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith("Could not remove auto order", "Cannot delete an active auto order.")
    expect(result.current.autoOrders).toEqual([order])
    expect(result.current.pendingId).toBeNull()
  })

  it("refresh() reloads both the auto orders list and the readiness computation", async () => {
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [] }))),
    )

    const { result } = renderHook(() => useAutoOrders())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])

    const refreshedOrder = makeAutoOrder({ id: "auto-2" })
    server.use(
      http.get("*/backend-api/auto-orders", () =>
        HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [refreshedOrder] })),
      ),
    )

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.autoOrders).toEqual([refreshedOrder])
  })
})
