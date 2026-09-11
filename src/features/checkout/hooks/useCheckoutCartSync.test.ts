import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import type { PlaceOrderPayload } from "@/lib/api/orders"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartUserProduct } from "@/test/factories"
import { useCheckoutCartSync } from "./useCheckoutCartSync"

/**
 * Reconciles two things the checkout store freezes against the live cart: the per-vendor
 * shipping-method map (`selectedVendorShippingMethods`) and the `orderPayload` snapshot taken at
 * the step 2→3 transition. Both can go stale if the cart changes underneath a mounted checkout
 * page (removing a vendor, browser back/forward to /cart, another tab).
 */

const cartItem = (userProductId: string, quantity: number, sellerId = "seller-1", sellerName = "Acme Dental") =>
  makeCartItem({
    id: `ci-${userProductId}`,
    quantity,
    userProduct: makeCartUserProduct({ userProductId, sellerId, sellerName }),
  })

const payloadFor = (lines: { userProductId: string; quantity: number; autoOrder?: null }[]): PlaceOrderPayload => ({
  addressId: "address-1",
  shippoRateOrders: [
    {
      shippoRateId: "rate-1",
      products: lines.map((line) => ({ ...line, autoOrder: line.autoOrder ?? null })),
    },
  ],
  uberRateOrders: [],
})

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("useCheckoutCartSync — vendor map pruning", () => {
  it("drops a vendor no longer in the cart while keeping the others and the rest of the store", () => {
    useCheckoutStore.setState({
      currentStep: 2,
      selectedShippingCost: 42,
      selectedVendorShippingMethods: {
        "seller-1": { sellerName: "Acme Dental", methodText: "Standard - 3 days", amount: 10 },
        "seller-2": { sellerName: "Beta Supply", methodText: "Express - 1 day", amount: 32 },
      },
    })
    useCartStore.setState({ items: [cartItem("up-1", 2, "seller-1", "Acme Dental")] })

    renderHook(() => useCheckoutCartSync())

    expect(Object.keys(useCheckoutStore.getState().selectedVendorShippingMethods)).toEqual(["seller-1"])
    expect(useCheckoutStore.getState().selectedShippingCost).toBe(42)
  })

  it("does not write to the store when the map already matches the cart", () => {
    const map = {
      "seller-1": { sellerName: "Acme Dental", methodText: "Standard - 3 days", amount: 10 },
    }
    useCheckoutStore.setState({ currentStep: 2, selectedVendorShippingMethods: map })
    useCartStore.setState({ items: [cartItem("up-1", 2, "seller-1", "Acme Dental")] })

    renderHook(() => useCheckoutCartSync())

    expect(useCheckoutStore.getState().selectedVendorShippingMethods).toBe(map)
  })

  it("keeps a seller grouped under its name (no sellerId) as live", () => {
    const map = {
      "No Id Seller": { sellerName: "No Id Seller", methodText: "Standard - 3 days", amount: 10 },
    }
    useCheckoutStore.setState({ currentStep: 2, selectedVendorShippingMethods: map })
    useCartStore.setState({
      items: [
        makeCartItem({
          userProduct: makeCartUserProduct({ userProductId: "up-1", sellerId: "", sellerName: "No Id Seller" }),
        }),
      ],
    })

    renderHook(() => useCheckoutCartSync())

    expect(useCheckoutStore.getState().selectedVendorShippingMethods).toBe(map)
  })
})

describe("useCheckoutCartSync — frozen payload vs. cart", () => {
  it("ignores an autoOrder-only difference between the payload and the cart", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payloadFor([
        { userProductId: "p1", quantity: 2 },
        { userProductId: "p2", quantity: 1 },
      ]),
    })
    useCartStore.setState({
      items: [
        makeCartItem({
          id: "ci-p1",
          quantity: 2,
          autoOrder: "ONE_MONTH",
          userProduct: makeCartUserProduct({ userProductId: "p1" }),
        }),
        makeCartItem({ id: "ci-p2", quantity: 1, userProduct: makeCartUserProduct({ userProductId: "p2" }) }),
      ],
    })

    renderHook(() => useCheckoutCartSync())

    expect(useCheckoutStore.getState().currentStep).toBe(3)
    expect(useCheckoutStore.getState().orderPayload).not.toBeNull()
    expect(warningToast).not.toHaveBeenCalled()
  })

  it("clears the shipping selection and bounces to step 2 when a cart quantity changes", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payloadFor([
        { userProductId: "p1", quantity: 2 },
        { userProductId: "p2", quantity: 1 },
      ]),
      selectedVendorShippingMethods: {
        "seller-1": { sellerName: "Acme Dental", methodText: "Standard - 3 days", amount: 10 },
      },
      selectedShippingCost: 10,
      selectedShippingEtaText: "Standard - 3 days",
      excludedFromOrder: [{ sellerName: "Beta Supply", itemNames: ["Widget"] }],
    })
    useCartStore.setState({
      items: [
        cartItem("p1", 3),
        makeCartItem({ id: "ci-p2", quantity: 1, userProduct: makeCartUserProduct({ userProductId: "p2" }) }),
      ],
    })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.orderPayload).toBeNull()
    expect(state.selectedVendorShippingMethods).toEqual({})
    expect(state.selectedShippingCost).toBe(0)
    expect(state.selectedShippingEtaText).toBe("")
    expect(state.excludedFromOrder).toEqual([])
    expect(state.currentStep).toBe(2)
    expect(warningToast).toHaveBeenCalledTimes(1)
    expect(warningToast).toHaveBeenCalledWith("Your cart changed", "Please review your shipping options.")
  })

  it("clears the shipping selection when a cart line is removed at step 4", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 4,
      orderPayload: payloadFor([
        { userProductId: "p1", quantity: 2 },
        { userProductId: "p2", quantity: 1 },
      ]),
    })
    useCartStore.setState({ items: [cartItem("p1", 2)] })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.orderPayload).toBeNull()
    expect(state.currentStep).toBe(2)
    expect(warningToast).toHaveBeenCalledTimes(1)
  })

  it("leaves an empty vendor map untouched on the confirmation step, even with an empty cart", () => {
    const map = {
      "seller-1": { sellerName: "Acme Dental", methodText: "Standard - 3 days", amount: 10 },
      "seller-2": { sellerName: "Beta Supply", methodText: "Express - 1 day", amount: 32 },
    }
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({ currentStep: 5, selectedVendorShippingMethods: map })
    useCartStore.setState({ items: [] })

    renderHook(() => useCheckoutCartSync())

    expect(useCheckoutStore.getState().selectedVendorShippingMethods).toBe(map)
    expect(useCheckoutStore.getState().currentStep).toBe(5)
    expect(warningToast).not.toHaveBeenCalled()
  })

  it("does nothing at step 3 with an empty cart, leaving the redirect guard to handle it", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payloadFor([{ userProductId: "p1", quantity: 2 }]),
    })
    useCartStore.setState({ items: [] })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.orderPayload).not.toBeNull()
    expect(state.currentStep).toBe(3)
    expect(warningToast).not.toHaveBeenCalled()
  })
})

describe("useCheckoutCartSync — excluded sellers (no selected rate)", () => {
  it("ignores a cart seller's lines when that seller is recorded as excluded from the order", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    const payload = payloadFor([{ userProductId: "p1", quantity: 2 }])
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payload,
      excludedFromOrder: [{ sellerName: "B name", itemNames: ["Widget B"] }],
    })
    useCartStore.setState({
      items: [cartItem("p1", 2, "seller-1", "Acme Dental"), cartItem("p3", 1, "seller-2", "B name")],
    })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.currentStep).toBe(3)
    expect(state.orderPayload).toBe(payload)
    expect(warningToast).not.toHaveBeenCalled()
  })

  it("bounces to step 2 when a new, not-excluded seller shows up in the cart with no payload lines", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payloadFor([{ userProductId: "p1", quantity: 2 }]),
      excludedFromOrder: [],
    })
    useCartStore.setState({
      items: [cartItem("p1", 2, "seller-1", "Acme Dental"), cartItem("p3", 1, "seller-2", "B name")],
    })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.orderPayload).toBeNull()
    expect(state.currentStep).toBe(2)
    expect(warningToast).toHaveBeenCalledTimes(1)
  })

  it("does not bounce when an excluded seller's cart quantity changes, since its lines are ignored", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    const payload = payloadFor([{ userProductId: "p1", quantity: 2 }])
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payload,
      excludedFromOrder: [{ sellerName: "B name", itemNames: ["Widget B"] }],
    })
    useCartStore.setState({
      items: [cartItem("p1", 2, "seller-1", "Acme Dental"), cartItem("p3", 5, "seller-2", "B name")],
    })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.currentStep).toBe(3)
    expect(state.orderPayload).toBe(payload)
    expect(warningToast).not.toHaveBeenCalled()
  })

  it("bounces when an ordered (not excluded) seller gains a cart line missing from the payload", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 3,
      orderPayload: payloadFor([{ userProductId: "p1", quantity: 2 }]),
      excludedFromOrder: [],
    })
    useCartStore.setState({
      items: [cartItem("p1", 2, "seller-1", "Acme Dental"), cartItem("p2", 1, "seller-1", "Acme Dental")],
    })

    renderHook(() => useCheckoutCartSync())

    const state = useCheckoutStore.getState()
    expect(state.orderPayload).toBeNull()
    expect(state.currentStep).toBe(2)
    expect(warningToast).toHaveBeenCalledTimes(1)
  })
})
