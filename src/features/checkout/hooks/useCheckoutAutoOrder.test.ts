import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { useCheckoutAutoOrder } from "./useCheckoutAutoOrder"

/**
 * The recurring lines are owned by the cart; checkout reads them, and — since the per-line
 * controls on Final Review landed — can also change or cancel a schedule. The pure
 * `savedCardNeedsAutoOrderConsent` helper exported from the same module is covered in
 * `saved-card-consent.test.ts` and deliberately not repeated here.
 */

const autoOrderItem = (userProductId: string, period: "TWO_WEEKS" | "ONE_MONTH" | "TWO_MONTHS", quantity = 1) =>
  makeCartItem({
    id: `ci-${userProductId}`,
    quantity,
    autoOrder: period,
    userProduct: makeCartUserProduct({ userProductId }),
    product: makeCartProductInfo({ id: `p-${userProductId}`, name: `Product ${userProductId}` }),
  })

beforeEach(() => {
  vi.restoreAllMocks()
  useCartStore.setState({ items: [], cartId: "cart-1", setItemAutoOrder: vi.fn().mockResolvedValue(undefined) })
  useCheckoutStore.getState().reset()
})

describe("useCheckoutAutoOrder", () => {
  it("reports no auto order items for an empty cart", () => {
    const { result } = renderHook(() => useCheckoutAutoOrder())

    expect(result.current.hasAutoOrderItems).toBe(false)
    expect(result.current.autoOrderLines).toEqual([])
  })

  it("ignores one-off lines", () => {
    useCartStore.setState({ items: [makeCartItem({ autoOrder: null })] })

    const { result } = renderHook(() => useCheckoutAutoOrder())

    expect(result.current.hasAutoOrderItems).toBe(false)
    expect(result.current.autoOrderLines).toEqual([])
  })

  it("maps each recurring line onto its product, quantity and human readable period", () => {
    useCartStore.setState({
      items: [autoOrderItem("up-a", "TWO_WEEKS", 3), makeCartItem({ id: "ci-plain", autoOrder: null })],
    })

    const { result } = renderHook(() => useCheckoutAutoOrder())

    expect(result.current.hasAutoOrderItems).toBe(true)
    expect(result.current.autoOrderLines).toEqual([
      {
        userProductId: "up-a",
        productName: "Product up-a",
        quantity: 3,
        period: "TWO_WEEKS",
        periodLabel: "Every 15 days",
      },
    ])
  })

  it.each([
    ["TWO_WEEKS", "Every 15 days"],
    ["ONE_MONTH", "Every 30 days"],
    ["TWO_MONTHS", "Every 60 days"],
  ] as const)("labels the %s period as %s", (period, label) => {
    useCartStore.setState({ items: [autoOrderItem("up-a", period)] })

    const { result } = renderHook(() => useCheckoutAutoOrder())

    expect(result.current.autoOrderLines[0].periodLabel).toBe(label)
  })

  it("keeps every recurring line, in cart order", () => {
    useCartStore.setState({
      items: [autoOrderItem("up-a", "ONE_MONTH"), makeCartItem({ id: "ci-x" }), autoOrderItem("up-b", "TWO_MONTHS")],
    })

    const { result } = renderHook(() => useCheckoutAutoOrder())

    expect(result.current.autoOrderLines.map((line) => line.userProductId)).toEqual(["up-a", "up-b"])
  })

  it("reacts when the buyer's recurring selection changes in the cart", () => {
    useCartStore.setState({ items: [autoOrderItem("up-a", "ONE_MONTH")] })
    const { result, rerender } = renderHook(() => useCheckoutAutoOrder())
    expect(result.current.hasAutoOrderItems).toBe(true)

    act(() => {
      useCartStore.setState({ items: [makeCartItem({ autoOrder: null })] })
    })
    rerender()

    expect(result.current.hasAutoOrderItems).toBe(false)
  })
})

describe("useCheckoutAutoOrder — schedule mutations", () => {
  it("changes a period by writing the cart first, then patching the frozen orderPayload snapshot", async () => {
    useCartStore.setState({ items: [autoOrderItem("up-a", "ONE_MONTH")] })
    useCheckoutStore.getState().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-a", quantity: 1, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })
    const { result } = renderHook(() => useCheckoutAutoOrder())

    await act(async () => {
      await result.current.onPeriodChange("up-a", "TWO_MONTHS")
    })

    expect(useCartStore.getState().setItemAutoOrder).toHaveBeenCalledWith("up-a", "TWO_MONTHS")
    expect(useCheckoutStore.getState().orderPayload?.shippoRateOrders[0].products[0].autoOrder).toBe("TWO_MONTHS")
  })

  it("cancels a repeat by writing null to both the cart and the frozen payload", async () => {
    useCartStore.setState({ items: [autoOrderItem("up-a", "ONE_MONTH")] })
    useCheckoutStore.getState().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-a", quantity: 1, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })
    const { result } = renderHook(() => useCheckoutAutoOrder())

    await act(async () => {
      await result.current.onCancelRecurrence("up-a")
    })

    expect(useCartStore.getState().setItemAutoOrder).toHaveBeenCalledWith("up-a", null)
    expect(useCheckoutStore.getState().orderPayload?.shippoRateOrders[0].products[0].autoOrder).toBeNull()
  })

  it("toasts and leaves the payload untouched when the cart write fails", async () => {
    const failingSetItemAutoOrder = vi.fn().mockRejectedValue(new Error("network down"))
    useCartStore.setState({ items: [autoOrderItem("up-a", "ONE_MONTH")], setItemAutoOrder: failingSetItemAutoOrder })
    useCheckoutStore.getState().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-a", quantity: 1, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })
    const errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
    const { result } = renderHook(() => useCheckoutAutoOrder())

    await act(async () => {
      await result.current.onCancelRecurrence("up-a")
    })

    expect(errorToast).toHaveBeenCalled()
    expect(useCheckoutStore.getState().orderPayload?.shippoRateOrders[0].products[0].autoOrder).toBe("ONE_MONTH")
  })

  it("marks a row pending while its write is in flight and clears it afterwards", async () => {
    let resolveWrite: () => void = () => {}
    const pendingWrite = new Promise<void>((resolve) => {
      resolveWrite = resolve
    })
    useCartStore.setState({
      items: [autoOrderItem("up-a", "ONE_MONTH")],
      setItemAutoOrder: vi.fn().mockReturnValue(pendingWrite),
    })
    const { result } = renderHook(() => useCheckoutAutoOrder())

    let writePromise!: Promise<void>
    act(() => {
      writePromise = result.current.onPeriodChange("up-a", "TWO_MONTHS")
    })

    await waitFor(() => expect(result.current.pendingUserProductIds.has("up-a")).toBe(true))

    resolveWrite()
    await act(async () => {
      await writePromise
    })

    expect(result.current.pendingUserProductIds.has("up-a")).toBe(false)
  })
})
