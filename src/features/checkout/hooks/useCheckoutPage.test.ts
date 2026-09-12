import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { type CheckoutStep, useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartProductInfo, makeCartUserProduct, makeLicense } from "@/test/factories"
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
  // buyer away from their confirmation (and its auto-order registration polling) while the
  // confirmation is still live — i.e. reached by a step transition, not a cold mount. See
  // "keeps the confirmation when the step reaches 5 after mount" below.
  it("resets a stale confirmation left by a previous order on mount", async () => {
    setStep(5)
    useCheckoutStore.setState({ orderResult: { orderId: "order-1" } as never })

    renderHook(() => useCheckoutPage())

    await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(1))
    expect(useCheckoutStore.getState().orderResult).toBeNull()
  })

  it("keeps the confirmation when the step reaches 5 after mount, even once the cart empties", async () => {
    setStep(4)
    useCartStore.setState({ items: [makeCartItem()] })

    const { result, rerender } = renderHook(() => useCheckoutPage())

    // Placing the order bumps the step and soft-deletes the cart server-side; neither the stale
    // reset nor the empty-cart guard may fire here.
    act(() => {
      setStep(5)
      useCartStore.setState({ items: [] })
    })
    rerender()

    await waitFor(() => expect(fetchCart).toHaveBeenCalled())
    expect(getRouterMock().push).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(5)
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
  ])("maps step %i onto the %s view", (step, view) => {
    setStep(step)
    useCartStore.setState({ items: [makeCartItem()] })

    const { result } = renderHook(() => useCheckoutPage())

    expect(result.current.currentStep).toBe(step)
    expect(result.current.view).toBe(view)
  })

  // Step 5 is deliberately excluded from the table above: a cold mount at step 5 is treated as a
  // stale confirmation and reset (see "resets a stale confirmation..."), not mapped to the
  // "confirmation" view.
  it("maps step 5 onto the confirmation view when reached by a transition, not a cold mount", () => {
    setStep(4)
    useCartStore.setState({ items: [makeCartItem()] })
    const { result, rerender } = renderHook(() => useCheckoutPage())

    act(() => setStep(5))
    rerender()

    expect(result.current.currentStep).toBe(5)
    expect(result.current.view).toBe("confirmation")
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

  describe("dental license guard (direct navigation)", () => {
    const licensedItem = () =>
      makeCartItem({
        product: makeCartProductInfo({ dentalLicenseRequired: "Yes" }),
        userProduct: makeCartUserProduct({ userProductId: "up-license" }),
      })

    it("bounces a buyer who navigates straight to checkout without a valid license", async () => {
      server.use(
        http.get("*/backend-api/licenses", () =>
          HttpResponse.json({ licenses: [makeLicense({ approved: false })], total: 1 }),
        ),
      )
      setStep(2)
      useCartStore.setState({ items: [licensedItem()] })

      renderHook(() => useCheckoutPage())

      await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
    })

    it("lets a buyer with an approved license stay on checkout", async () => {
      server.use(
        http.get("*/backend-api/licenses", () =>
          HttpResponse.json({ licenses: [makeLicense({ approved: true, expired: false })], total: 1 }),
        ),
      )
      setStep(2)
      useCartStore.setState({ items: [licensedItem()] })

      renderHook(() => useCheckoutPage())

      // Give the license fetch a tick to settle before asserting nothing fired.
      await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1))
      expect(getRouterMock().replace).not.toHaveBeenCalled()
      expect(getRouterMock().push).not.toHaveBeenCalledWith("/cart")
    })

    // Never redirect on the pre-fetch default: the guard must wait for the SETTLED license
    // result, exactly like the cart page's click-time gate does.
    it("does not redirect while the license check is still in flight", async () => {
      let releaseLicenseResponse: (() => void) | undefined
      const gate = new Promise<void>((resolve) => {
        releaseLicenseResponse = resolve
      })
      server.use(
        http.get("*/backend-api/licenses", async () => {
          await gate
          return HttpResponse.json({ licenses: [makeLicense({ approved: false })], total: 1 })
        }),
      )
      setStep(2)
      useCartStore.setState({ items: [licensedItem()] })

      renderHook(() => useCheckoutPage())

      expect(getRouterMock().replace).not.toHaveBeenCalled()

      await act(async () => {
        releaseLicenseResponse?.()
        await gate
      })

      await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
    })

    it("never redirects on the confirmation step, even without a valid license", async () => {
      server.use(
        http.get("*/backend-api/licenses", () =>
          HttpResponse.json({ licenses: [makeLicense({ approved: false })], total: 1 }),
        ),
      )
      setStep(5)
      useCartStore.setState({ items: [licensedItem()] })

      renderHook(() => useCheckoutPage())

      await waitFor(() => expect(fetchCart).toHaveBeenCalled())
      expect(getRouterMock().replace).not.toHaveBeenCalled()
      expect(getRouterMock().push).not.toHaveBeenCalledWith("/cart")
    })

    it("does not touch a cart that requires no license", async () => {
      server.use(http.get("*/backend-api/licenses", () => new HttpResponse(null, { status: 500 })))
      setStep(2)
      useCartStore.setState({ items: [makeCartItem()] })

      renderHook(() => useCheckoutPage())

      await waitFor(() => expect(fetchCart).toHaveBeenCalled())
      expect(getRouterMock().replace).not.toHaveBeenCalled()
    })
  })
})
