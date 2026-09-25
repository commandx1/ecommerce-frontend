import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SavedPaymentMethod } from "@/features/buyer-dashboard/payment-methods/paymentMethodsData"
import { addressAPI } from "@/lib/api/address"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { makeAddress, makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
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

/** Counts every `GET /auto-orders` the hook makes, mirroring the `/cards` counter pattern from
 * the payment-methods characterization (B2a). */
const serveAutoOrdersWithGetCount = (...autoOrders: ReturnType<typeof makeAutoOrder>[]) => {
  const state = { count: 0 }
  server.use(
    http.get("*/backend-api/auto-orders", () => {
      state.count += 1
      return HttpResponse.json(makeAutoOrdersResponse({ autoOrders }))
    }),
  )
  return state
}

describe("useAutoOrders", () => {
  beforeEach(() => {
    mockToastError.mockReset()
    // `addressAPI.getAddresses` dedupes/caches at module scope; spying bypasses that cache so
    // every test gets exactly the response it configures instead of a stale one from a previous
    // test, and lets the spy's own `.mock.calls` double as a request counter.
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([])
  })

  it("loads auto orders on mount and turns off isLoading once settled", async () => {
    const order = makeAutoOrder()
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
    )

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([order])
  })

  it("mount fires exactly one GET each for auto-orders, addresses and payment-method cards", async () => {
    const autoOrdersCounter = serveAutoOrdersWithGetCount(makeAutoOrder())

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))

    expect(autoOrdersCounter.count).toBe(1)
    expect(addressAPI.getAddresses).toHaveBeenCalledTimes(1)
    expect(paymentMethodsAPI.getSavedCards).toHaveBeenCalledTimes(1)
  })

  it("handles an empty auto-orders list", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ autoOrders: [], total: 0 })))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])
  })

  // `?? []` only catches null/undefined. A malformed 200 carrying a wrong-typed truthy value
  // passes through it and reaches .map()/.length in the list, blanking the page
  // (infra note #26 - the same root pattern found in twelve other modules this week).
  it.each([
    ["an object", { nope: true }],
    ["a string", "nope"],
    ["a number", 3],
  ])("shows an empty list instead of crashing when autoOrders is %s", async (_label, autoOrders) => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ autoOrders, total: 0 })))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])
  })

  it("surfaces a toast and stops loading when the initial fetch fails", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])
    expect(mockToastError).toHaveBeenCalledWith("Failed to load auto orders", "boom")
  })

  it("readiness is not ready when there is no default address, even with a usable card", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: false })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([readyCard])
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.hasPrimaryAddress).toBe(false)
    expect(result.current.readiness.hasAutoOrderCard).toBe(true)
    expect(result.current.readiness.isReady).toBe(false)
  })

  it("readiness is not ready when the saved card is not open to automatic payment", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([{ ...readyCard, openToAutoPayment: false }])
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.hasAutoOrderCard).toBe(false)
    expect(result.current.readiness.isReady).toBe(false)
  })

  it("readiness is ready when a default address and a usable auto-order card both exist", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockResolvedValue([readyCard])
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.isReady).toBe(true)
  })

  it("readiness tolerates the address/card lookups failing (treated as not-ready, not a crash)", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockRejectedValue(new Error("network down"))
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockRejectedValue(new Error("network down"))
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.isReady).toBe(false)
  })

  it("a failed readiness read does not poison the shared payment-methods-cards cache with an empty list", async () => {
    vi.spyOn(addressAPI, "getAddresses").mockResolvedValue([makeAddress({ defaultAddress: true })])
    vi.spyOn(paymentMethodsAPI, "getSavedCards").mockRejectedValue(new Error("network down"))
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())))

    const { client, wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useAutoOrders(), { wrapper })

    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.readiness.hasAutoOrderCard).toBe(false)
    // The `.catch(() => [])` fallback lives in the hook's derivation only - the cache entry the
    // payment-methods page reads must stay untouched (undefined, not `[]`) after the failure.
    expect(client.getQueryData(queryKeys.paymentMethods.cards())).toBeUndefined()
  })

  it("updateAutoOrder replaces the updated order in place and returns true on success", async () => {
    const order = makeAutoOrder({ id: "auto-1", quantity: 1 })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.patch("*/backend-api/auto-orders/:autoOrderId", ({ params }) =>
        HttpResponse.json(makeAutoOrder({ id: String(params.autoOrderId), quantity: 5 })),
      ),
    )

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateAutoOrder("auto-1", { quantity: 5 })
    })

    expect(success).toBe(true)
    expect(result.current.autoOrders[0]?.quantity).toBe(5)
    expect(result.current.pendingId).toBeNull()
  })

  it("updateAutoOrder shows a toast, refetches readiness once, and returns false on a 400 (e.g. not ready to activate)", async () => {
    const order = makeAutoOrder({ id: "auto-1", active: false })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.patch("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json({ message: "A primary address and an auto order card are required." }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    vi.mocked(addressAPI.getAddresses).mockClear()
    vi.mocked(paymentMethodsAPI.getSavedCards).mockClear()

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
    expect(addressAPI.getAddresses).toHaveBeenCalledTimes(1)
    expect(paymentMethodsAPI.getSavedCards).toHaveBeenCalledTimes(1)
  })

  it("deleteAutoOrder removes the order from the list and returns true on success, without an extra GET", async () => {
    const order = makeAutoOrder({ id: "auto-1" })
    const autoOrdersCounter = serveAutoOrdersWithGetCount(order)
    server.use(http.delete("*/backend-api/auto-orders/:autoOrderId", () => new HttpResponse(null, { status: 204 })))

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(autoOrdersCounter.count).toBe(1)

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.deleteAutoOrder("auto-1")
    })

    expect(success).toBe(true)
    expect(result.current.autoOrders).toEqual([])
    expect(autoOrdersCounter.count).toBe(1)
  })

  it("deleteAutoOrder shows a toast and keeps the list unchanged on failure", async () => {
    const order = makeAutoOrder({ id: "auto-1" })
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [order] }))),
      http.delete("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json({ message: "Cannot delete an active auto order." }, { status: 409 }),
      ),
    )

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })
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

  it("refresh() reloads auto orders, addresses and payment-method cards (one GET each)", async () => {
    let autoOrdersToServe: ReturnType<typeof makeAutoOrder>[] = []
    const state = { count: 0 }
    server.use(
      http.get("*/backend-api/auto-orders", () => {
        state.count += 1
        return HttpResponse.json(makeAutoOrdersResponse({ autoOrders: autoOrdersToServe }))
      }),
    )

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.readiness.isLoading).toBe(false))
    expect(result.current.autoOrders).toEqual([])
    expect(state.count).toBe(1)

    const refreshedOrder = makeAutoOrder({ id: "auto-2" })
    autoOrdersToServe = [refreshedOrder]

    await act(async () => {
      await result.current.refresh()
    })

    expect(state.count).toBe(2)
    expect(addressAPI.getAddresses).toHaveBeenCalledTimes(2)
    expect(paymentMethodsAPI.getSavedCards).toHaveBeenCalledTimes(2)
    // The queryFn/network round-trip is done by the time `refresh()` resolves (asserted above);
    // the hook's own re-render lands a tick later, same "robustness-only wait" as every other
    // useQuery-backed hook in this suite.
    await waitFor(() => expect(result.current.autoOrders).toEqual([refreshedOrder]))
  })

  it("refresh() toasts once when the auto-orders reload fails", async () => {
    server.use(
      http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [] }))),
    )

    const { result } = renderHook(() => useAutoOrders(), { wrapper: createQueryWrapper().wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockToastError).toHaveBeenCalledWith("Failed to load auto orders", "boom")
  })
})
