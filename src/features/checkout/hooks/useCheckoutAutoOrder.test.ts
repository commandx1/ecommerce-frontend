import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import { cartCommands } from "@/features/cart/api/cart-queries"
import type { CartItem } from "@/lib/api/cart"
import { queryKeys } from "@/lib/query/keys"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useCheckoutAutoOrder } from "./useCheckoutAutoOrder"

/**
 * The recurring lines are owned by the cart; checkout reads them, and — since the per-line
 * controls on Final Review landed — can also change or cancel a schedule. The pure
 * `savedCardNeedsAutoOrderConsent` helper exported from the same module is covered in
 * `saved-card-consent.test.ts` and deliberately not repeated here.
 *
 * `useCheckoutAutoOrder` reads the cart through `useCartItems` (a disabled reader, design doc §7
 * step 5) and writes through `cartCommands.setItemAutoOrder`, so every test seeds the query cache
 * directly instead of `useCartStore.setState`, and spies on `cartCommands.setItemAutoOrder`
 * instead of swapping out a store action.
 */

const autoOrderItem = (userProductId: string, period: "TWO_WEEKS" | "ONE_MONTH" | "TWO_MONTHS", quantity = 1) =>
  makeCartItem({
    id: `ci-${userProductId}`,
    quantity,
    autoOrder: period,
    userProduct: makeCartUserProduct({ userProductId }),
    product: makeCartProductInfo({ id: `p-${userProductId}`, name: `Product ${userProductId}` }),
  })

/** Seeds the cart cache with `items` (a disabled-reader hook, so no fetch/wait is involved) and mounts the hook. */
const renderAutoOrder = (items: CartItem[]) => {
  const { wrapper, client } = createQueryWrapper()
  client.setQueryData(queryKeys.cart.detail(), { cartId: "cart-1", cartItems: items })
  return renderHook(() => useCheckoutAutoOrder(), { wrapper })
}

beforeEach(() => {
  vi.restoreAllMocks()
  useCheckoutStore.getState().reset()
})

describe("useCheckoutAutoOrder", () => {
  it("reports no auto order items for an empty cart", () => {
    const { result } = renderAutoOrder([])

    expect(result.current.hasAutoOrderItems).toBe(false)
    expect(result.current.autoOrderLines).toEqual([])
  })

  it("ignores one-off lines", () => {
    const { result } = renderAutoOrder([makeCartItem({ autoOrder: null })])

    expect(result.current.hasAutoOrderItems).toBe(false)
    expect(result.current.autoOrderLines).toEqual([])
  })

  it("maps each recurring line onto its product, quantity and human readable period", () => {
    const { result } = renderAutoOrder([
      autoOrderItem("up-a", "TWO_WEEKS", 3),
      makeCartItem({ id: "ci-plain", autoOrder: null }),
    ])

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
    const { result } = renderAutoOrder([autoOrderItem("up-a", period)])

    expect(result.current.autoOrderLines[0].periodLabel).toBe(label)
  })

  it("keeps every recurring line, in cart order", () => {
    const { result } = renderAutoOrder([
      autoOrderItem("up-a", "ONE_MONTH"),
      makeCartItem({ id: "ci-x" }),
      autoOrderItem("up-b", "TWO_MONTHS"),
    ])

    expect(result.current.autoOrderLines.map((line) => line.userProductId)).toEqual(["up-a", "up-b"])
  })

  it("reacts when the buyer's recurring selection changes in the cart", () => {
    const { wrapper, client } = createQueryWrapper()
    client.setQueryData(queryKeys.cart.detail(), { cartId: "cart-1", cartItems: [autoOrderItem("up-a", "ONE_MONTH")] })
    const { result, rerender } = renderHook(() => useCheckoutAutoOrder(), { wrapper })
    expect(result.current.hasAutoOrderItems).toBe(true)

    act(() => {
      client.setQueryData(queryKeys.cart.detail(), { cartId: "cart-1", cartItems: [makeCartItem({ autoOrder: null })] })
    })
    rerender()

    expect(result.current.hasAutoOrderItems).toBe(false)
  })
})

describe("useCheckoutAutoOrder — schedule mutations", () => {
  it("changes a period by writing the cart first, then patching the frozen orderPayload snapshot", async () => {
    const setItemAutoOrder = vi.spyOn(cartCommands, "setItemAutoOrder").mockResolvedValue(undefined)
    useCheckoutStore.getState().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-a", quantity: 1, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })
    const { result } = renderAutoOrder([autoOrderItem("up-a", "ONE_MONTH")])

    await act(async () => {
      await result.current.onPeriodChange("up-a", "TWO_MONTHS")
    })

    expect(setItemAutoOrder).toHaveBeenCalledWith("up-a", "TWO_MONTHS")
    expect(useCheckoutStore.getState().orderPayload?.shippoRateOrders[0].products[0].autoOrder).toBe("TWO_MONTHS")
  })

  it("cancels a repeat by writing null to both the cart and the frozen payload", async () => {
    const setItemAutoOrder = vi.spyOn(cartCommands, "setItemAutoOrder").mockResolvedValue(undefined)
    useCheckoutStore.getState().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-a", quantity: 1, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })
    const { result } = renderAutoOrder([autoOrderItem("up-a", "ONE_MONTH")])

    await act(async () => {
      await result.current.onCancelRecurrence("up-a")
    })

    expect(setItemAutoOrder).toHaveBeenCalledWith("up-a", null)
    expect(useCheckoutStore.getState().orderPayload?.shippoRateOrders[0].products[0].autoOrder).toBeNull()
  })

  it("toasts and leaves the payload untouched when the cart write fails", async () => {
    vi.spyOn(cartCommands, "setItemAutoOrder").mockRejectedValue(new Error("network down"))
    useCheckoutStore.getState().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-a", quantity: 1, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })
    const errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
    const { result } = renderAutoOrder([autoOrderItem("up-a", "ONE_MONTH")])

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
    vi.spyOn(cartCommands, "setItemAutoOrder").mockReturnValue(pendingWrite)
    const { result } = renderAutoOrder([autoOrderItem("up-a", "ONE_MONTH")])

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
