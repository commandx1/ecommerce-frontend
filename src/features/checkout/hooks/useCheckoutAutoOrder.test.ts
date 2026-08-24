import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useCartStore } from "@/stores/cartStore"
import { makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { useCheckoutAutoOrder } from "./useCheckoutAutoOrder"

/**
 * The recurring lines are owned by the cart; checkout only reads them. The pure
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
  useCartStore.setState({ items: [], cartId: "cart-1" })
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
