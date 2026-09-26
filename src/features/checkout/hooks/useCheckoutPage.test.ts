import { act, renderHook, waitFor } from "@testing-library/react"
import { delay, HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { EMPTY_CART } from "@/features/cart/api/cart-queries"
import type { Cart } from "@/lib/api/cart"
import type { License } from "@/lib/api/licenses"
import { server } from "@/mocks/server"
import { type CheckoutStep, useCheckoutStore } from "@/stores/checkoutStore"
import { seedCart } from "@/test/cart"
import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct, makeLicense } from "@/test/factories"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { createQueryWrapper } from "@/test/render"
import { useCheckoutPage } from "./useCheckoutPage"

/**
 * `useCheckoutPage` is the shell around the whole flow: it refreshes the cart once (design doc
 * §5/§7 step 5 - a fetch owner, same as `useCartPage`), bounces the buyer back to /cart when
 * there is nothing left to pay for, and maps the numeric step onto the view the page renders.
 *
 * Cart data comes from the query cache, so every test drives it through the `GET /cart` msw
 * handler (like `useCartPage.test.ts`).
 *
 * A buyer who clicks through from `/cart` arrives with the `cart.detail` entry already warm
 * (populated moments earlier by `useCartPage`'s own mount fetch) - `SEED_STALE_MS` seeds that
 * scenario: data is available synchronously at mount (no empty-state flash, no spurious
 * empty-cart redirect) while still being older than the query's 1s dedup window, so
 * `refreshCart()` still issues its own `GET /cart` exactly like it would for a real stale cache.
 * Tests that omit the seed model a genuinely cold cache (a hard refresh landing straight on
 * `/checkout`), where `items` really does start empty until the mount fetch resolves.
 */

const SEED_STALE_MS = 2_000

interface Recorder {
  cartGets: number
  licenseGets: number
}

let recorder: Recorder
let cartResponse: Cart
let licenseResponse: { status: number; licenses: License[] }

const installHandlers = () => {
  server.use(
    http.get("*/backend-api/cart", () => {
      recorder.cartGets += 1
      return HttpResponse.json(cartResponse)
    }),
    http.get("*/backend-api/licenses", () => {
      recorder.licenseGets += 1
      if (licenseResponse.status >= 400) {
        return new HttpResponse(null, { status: licenseResponse.status })
      }
      return HttpResponse.json({ licenses: licenseResponse.licenses, total: licenseResponse.licenses.length })
    }),
  )
}

const setStep = (step: CheckoutStep) => {
  useCheckoutStore.setState({ currentStep: step })
}

/**
 * Wraps the hook the same way the app does: one `QueryClient` per render. Pass `warmCart` to
 * seed the cache before mount (see file banner); omit it to model a cold cache.
 */
const renderCheckoutPage = (warmCart?: Cart) => {
  const { wrapper, client } = createQueryWrapper()
  if (warmCart) {
    seedCart(client, warmCart, { updatedAt: Date.now() - SEED_STALE_MS })
  }
  const rendered = renderHook(() => useCheckoutPage(), { wrapper })
  return { ...rendered, client }
}

beforeEach(() => {
  recorder = { cartGets: 0, licenseGets: 0 }
  cartResponse = makeCart({ cartItems: [makeCartItem()] })
  licenseResponse = { status: 200, licenses: [makeLicense()] }
  installHandlers()
})

describe("useCheckoutPage", () => {
  it("refreshes the cart exactly once on mount", async () => {
    setStep(2)

    const { rerender } = renderCheckoutPage(cartResponse)
    rerender()

    await waitFor(() => expect(recorder.cartGets).toBe(1))
  })

  it("redirects to the cart when the cart is empty before the confirmation step", async () => {
    setStep(2)
    cartResponse = makeCart({ cartItems: [] })

    renderCheckoutPage()

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/cart"))
  })

  // Characterization, not a fix (design doc §7 step 5): the empty-cart guard reads the reader's
  // fallback `[]` the instant it mounts, before the mount `refreshCart()` has settled - exactly
  // like the old store, whose `items` also started as `[]` until the first fetch landed. A hard
  // refresh on a non-empty cart therefore still bounces the buyer to /cart for one tick.
  it("redirects while the cart is still loading, even though the fetch will resolve with items", async () => {
    setStep(2)
    server.use(
      http.get("*/backend-api/cart", async () => {
        recorder.cartGets += 1
        await delay(50)
        return HttpResponse.json(cartResponse)
      }),
    )

    renderCheckoutPage()

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/cart"))
    // The fetch was still in flight when the redirect fired.
    expect(recorder.cartGets).toBe(1)
  })

  // The cart is deliberately emptied once the order is placed, so step 5 must never bounce the
  // buyer away from their confirmation (and its auto-order registration polling) while the
  // confirmation is still live — i.e. reached by a step transition, not a cold mount. See
  // "keeps the confirmation when the step reaches 5 after mount" below.
  it("resets a stale confirmation left by a previous order on mount, then sends the buyer to the cart", async () => {
    setStep(5)
    useCheckoutStore.setState({ orderResult: { orderId: "order-1" } as never })

    renderCheckoutPage(cartResponse)

    await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(1))
    expect(useCheckoutStore.getState().orderResult).toBeNull()
    await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
  })

  it("sends a fresh mount at step 1 straight to the cart, even with items in it", async () => {
    setStep(1)

    renderCheckoutPage(cartResponse)

    await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
  })

  it("keeps the confirmation when the step reaches 5 after mount, even once the cart empties", async () => {
    setStep(4)
    const { result, rerender, client } = renderCheckoutPage(cartResponse)

    await waitFor(() => expect(recorder.cartGets).toBe(1))

    // Placing the order bumps the step and soft-deletes the cart server-side; neither the stale
    // reset nor the empty-cart guard may fire here.
    act(() => {
      setStep(5)
      seedCart(client, EMPTY_CART)
    })
    rerender()

    expect(getRouterMock().push).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(5)
    expect(result.current.view).toBe("confirmation")
  })

  it("does not redirect while the cart still has items", async () => {
    setStep(3)

    renderCheckoutPage(cartResponse)

    await waitFor(() => expect(recorder.cartGets).toBe(1))
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })

  it.each<[CheckoutStep, string]>([
    [1, "empty"],
    [2, "shipping"],
    [3, "billing"],
    [4, "review"],
  ])("maps step %i onto the %s view", async (step, view) => {
    setStep(step)

    const { result } = renderCheckoutPage(cartResponse)
    await waitFor(() => expect(recorder.cartGets).toBe(1))

    expect(result.current.currentStep).toBe(step)
    expect(result.current.view).toBe(view)
  })

  // Step 5 is deliberately excluded from the table above: a cold mount at step 5 is treated as a
  // stale confirmation and reset (see "resets a stale confirmation..."), not mapped to the
  // "confirmation" view.
  it("maps step 5 onto the confirmation view when reached by a transition, not a cold mount", async () => {
    setStep(4)
    const { result, rerender } = renderCheckoutPage(cartResponse)
    await waitFor(() => expect(recorder.cartGets).toBe(1))

    act(() => setStep(5))
    rerender()

    expect(result.current.currentStep).toBe(5)
    expect(result.current.view).toBe("confirmation")
  })

  it("hides the order summary only on the confirmation step", async () => {
    setStep(4)
    const { result, rerender } = renderCheckoutPage(cartResponse)
    await waitFor(() => expect(recorder.cartGets).toBe(1))
    expect(result.current.showOrderSummary).toBe(true)

    act(() => setStep(5))
    rerender()
    expect(result.current.showOrderSummary).toBe(false)
  })

  it("redirects as soon as the cart empties mid-flow", async () => {
    setStep(2)
    const { rerender, client } = renderCheckoutPage(cartResponse)
    await waitFor(() => expect(recorder.cartGets).toBe(1))
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      seedCart(client, EMPTY_CART)
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
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: false })] }
      setStep(2)

      renderCheckoutPage()

      await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
    })

    it("lets a buyer with an approved license stay on checkout", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: true, expired: false })] }
      setStep(2)

      renderCheckoutPage(cartResponse)

      // Give the license fetch a tick to settle before asserting nothing fired.
      await waitFor(() => expect(recorder.licenseGets).toBeGreaterThan(0))
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
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      server.use(
        http.get("*/backend-api/licenses", async () => {
          recorder.licenseGets += 1
          await gate
          return HttpResponse.json({ licenses: [makeLicense({ approved: false })], total: 1 })
        }),
      )
      setStep(2)

      renderCheckoutPage(cartResponse)

      expect(getRouterMock().replace).not.toHaveBeenCalled()

      await act(async () => {
        releaseLicenseResponse?.()
        await gate
      })

      await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
    })

    // A cold mount at step 5 always resets to step 1 first ("resets a stale confirmation..."
    // above), and the step-1 guard then sends the buyer straight back to /cart - regardless of
    // license state, since there is nothing left to show at a reset step 1.
    it("sends the buyer to the cart once a stale step-5 confirmation has reset to step 1, if their license is invalid", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: false })] }
      setStep(5)

      renderCheckoutPage(cartResponse)

      await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(1))
      await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
    })

    it("sends the buyer to the cart once a stale step-5 confirmation has reset to step 1, even with a valid license", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: true, expired: false })] }
      setStep(5)

      renderCheckoutPage(cartResponse)

      await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(1))
      await waitFor(() => expect(getRouterMock().replace).toHaveBeenCalledWith("/cart"))
    })

    it("does not touch a cart that requires no license", async () => {
      licenseResponse = { status: 500, licenses: [] }
      setStep(2)

      renderCheckoutPage(cartResponse)

      await waitFor(() => expect(recorder.cartGets).toBe(1))
      expect(getRouterMock().replace).not.toHaveBeenCalled()
    })
  })
})
