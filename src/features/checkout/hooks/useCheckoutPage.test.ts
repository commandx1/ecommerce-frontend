import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCartStore } from "@/stores/cartStore"
import { type CheckoutStep, useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem } from "@/test/factories"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { useCheckoutPage } from "./useCheckoutPage"

/**
 * `useCheckoutPage` is the shell around the whole flow: it refreshes the cart once, bounces the
 * buyer back to /cart when there is nothing left to pay for, and maps the numeric step onto the
 * view the page renders.
 *
 * `fetchCart` is swapped for a spy in `beforeEach` (never in `afterEach` — this file's `afterEach`
 * runs before the global `cleanup()`, so a store write there would re-render a mounted tree).
 */

let fetchCart: ReturnType<typeof vi.fn>

const setStep = (step: CheckoutStep) => {
  useCheckoutStore.setState({ currentStep: step })
}

beforeEach(() => {
  fetchCart = vi.fn().mockResolvedValue(undefined)
  useCartStore.setState({ fetchCart, items: [], cartId: "cart-1" })
})

describe("useCheckoutPage", () => {
  it("refreshes the cart exactly once on mount", async () => {
    setStep(2)
    useCartStore.setState({ items: [makeCartItem()] })

    const { rerender } = renderHook(() => useCheckoutPage())
    rerender()

    await waitFor(() => expect(fetchCart).toHaveBeenCalledTimes(1))
  })

  it("redirects to the cart when the cart is empty before the confirmation step", async () => {
    setStep(2)

    renderHook(() => useCheckoutPage())

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/cart"))
  })

  // The cart is deliberately emptied once the order is placed, so step 5 must never bounce the
  // buyer away from their confirmation (and its auto-order registration polling).
  it("stays on the confirmation step even with an empty cart", async () => {
    setStep(5)

    const { result } = renderHook(() => useCheckoutPage())

    await waitFor(() => expect(fetchCart).toHaveBeenCalled())
    expect(getRouterMock().push).not.toHaveBeenCalled()
    expect(result.current.view).toBe("confirmation")
  })

  it("does not redirect while the cart still has items", async () => {
    setStep(3)
    useCartStore.setState({ items: [makeCartItem()] })

    renderHook(() => useCheckoutPage())

    await waitFor(() => expect(fetchCart).toHaveBeenCalled())
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })

  it.each<[CheckoutStep, string]>([
    [1, "empty"],
    [2, "shipping"],
    [3, "billing"],
    [4, "review"],
    [5, "confirmation"],
  ])("maps step %i onto the %s view", (step, view) => {
    setStep(step)
    useCartStore.setState({ items: [makeCartItem()] })

    const { result } = renderHook(() => useCheckoutPage())

    expect(result.current.currentStep).toBe(step)
    expect(result.current.view).toBe(view)
  })

  it("hides the order summary only on the confirmation step", () => {
    useCartStore.setState({ items: [makeCartItem()] })
    setStep(4)
    const { result, rerender } = renderHook(() => useCheckoutPage())
    expect(result.current.showOrderSummary).toBe(true)

    act(() => setStep(5))
    rerender()
    expect(result.current.showOrderSummary).toBe(false)
  })

  it("redirects as soon as the cart empties mid-flow", async () => {
    setStep(2)
    useCartStore.setState({ items: [makeCartItem()] })
    const { rerender } = renderHook(() => useCheckoutPage())
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      useCartStore.setState({ items: [] })
    })
    rerender()

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/cart"))
  })
})
