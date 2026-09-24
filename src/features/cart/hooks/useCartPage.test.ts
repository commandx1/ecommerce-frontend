import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { createElement, type ReactNode, StrictMode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Address } from "@/lib/api/address"
import type { Cart } from "@/lib/api/cart"
import type { License } from "@/lib/api/licenses"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import {
  makeAccountUser,
  makeAddress,
  makeCart,
  makeCartItem,
  makeCartProductInfo,
  makeCartUserProduct,
  makeLicense,
  makeTaxEstimate,
} from "@/test/factories"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { createQueryWrapper } from "@/test/render"
import { useCartPage } from "./useCartPage"

const mockToastError = vi.fn()
const mockToastWarning = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

const DEBOUNCE_MS = 450

interface QuantityWrite {
  userProductId: string
  quantity: number
  autoOrder: string | null
}

interface Recorder {
  cartGets: number
  puts: QuantityWrite[]
  deleteItems: unknown[]
  cartDeletes: number
  licenseGets: number
  addressGets: number
}

let recorder: Recorder
/** Response the mocked `GET /cart` hands back; reassign inside a test to change it mid-flight. */
let cartResponse: Cart
let licenseResponse: { status: number; licenses: License[] }
let putStatus: number
/** Response (or HTTP status) the mocked `GET /address` hands back. */
let addressResponse: { status: number; addresses: Address[] }

/**
 * Registers the cart/license/address/tax handlers this suite drives. Everything the hook touches
 * goes through MSW so the assertions can count real HTTP calls rather than mocked store methods.
 */
const installHandlers = () => {
  server.use(
    http.get("*/backend-api/cart", () => {
      recorder.cartGets += 1
      return HttpResponse.json(cartResponse)
    }),
    http.put("*/backend-api/cart/items", async ({ request }) => {
      const body = (await request.json()) as QuantityWrite
      recorder.puts.push(body)
      if (putStatus >= 400) {
        return new HttpResponse(null, { status: putStatus })
      }
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/backend-api/cart/items", async ({ request }) => {
      recorder.deleteItems.push(await request.json())
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/backend-api/cart", () => {
      recorder.cartDeletes += 1
      return new HttpResponse(null, { status: 200 })
    }),
    http.get("*/backend-api/licenses", () => {
      recorder.licenseGets += 1
      if (licenseResponse.status >= 400) {
        return new HttpResponse(null, { status: licenseResponse.status })
      }
      return HttpResponse.json({ licenses: licenseResponse.licenses, total: licenseResponse.licenses.length })
    }),
    http.get("*/backend-api/address", () => {
      recorder.addressGets += 1
      if (addressResponse.status >= 400) {
        return new HttpResponse(null, { status: addressResponse.status })
      }
      return HttpResponse.json(addressResponse.addresses)
    }),
  )
}

const licensedItem = () =>
  makeCartItem({
    id: "ci-license",
    product: makeCartProductInfo({ dentalLicenseRequired: "Yes" }),
  })

const blockedItem = () =>
  makeCartItem({
    id: "ci-blocked",
    userProduct: makeCartUserProduct({ userProductId: "up-blocked", stockAlert: "Out of stock" }),
  })

/** Wraps a hook tree the same way the app does: one `QueryClient` per render. */
const renderCartPage = () => {
  const { wrapper } = createQueryWrapper()
  return renderHook(() => useCartPage(), { wrapper })
}

/** Same as `renderCartPage`, but also hands back the `QueryClient` for direct cache control. */
const renderCartPageWithClient = () => {
  const { wrapper, client } = createQueryWrapper()
  const rendered = renderHook(() => useCartPage(), { wrapper })
  return { ...rendered, client }
}

/** Same as `renderCartPage`, but also mounted under `StrictMode` (double mount/unmount). */
const renderCartPageStrictMode = () => {
  const { wrapper: queryWrapper } = createQueryWrapper()
  const wrapper = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, queryWrapper({ children }))
  return renderHook(() => useCartPage(), { wrapper })
}

/** Lets the real 450ms debounce window elapse (and any resulting state update settle). */
const settleDebounceWindow = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS + 150))
  })
}

/** Waits until the mount fetch has landed and the hook has left its loading state. */
const renderReadyCartPage = async () => {
  const rendered = renderCartPage()
  await waitFor(() => {
    expect(rendered.result.current.viewState).not.toBe("loading")
  })
  return rendered
}

describe("useCartPage", () => {
  // Store setup lives in `beforeEach`: a file-local `afterEach` would run before the global
  // `cleanup()` and tear state down while the hook is still mounted.
  //
  // `src/lib/api/address.ts` memoises `GET /address` responses in module scope with no reset
  // hook (2s dedup window keyed on `Date.now()`), so a fast-running test right after another
  // would otherwise see the previous test's cached address list. Faking "now" forward per test
  // keeps one test's address data out of the next (same fix as `CheckoutPage.test.tsx`).
  let clockOffset = 0
  beforeEach(() => {
    vi.restoreAllMocks()
    clockOffset += 60_000
    const realNow = Date.now.bind(Date)
    vi.spyOn(Date, "now").mockImplementation(() => realNow() + clockOffset)

    recorder = { cartGets: 0, puts: [], deleteItems: [], cartDeletes: 0, licenseGets: 0, addressGets: 0 }
    cartResponse = makeCart()
    licenseResponse = { status: 200, licenses: [makeLicense()] }
    putStatus = 200
    addressResponse = { status: 200, addresses: [makeAddress()] }
    mockToastError.mockClear()
    mockToastWarning.mockClear()
    installHandlers()
  })

  describe("mount", () => {
    it("fetches the cart exactly once and exposes its items", async () => {
      const { result } = await renderReadyCartPage()

      expect(recorder.cartGets).toBe(1)
      expect(result.current.viewState).toBe("ready")
      expect(result.current.items).toHaveLength(1)
      expect(result.current.cartId).toBe("2ba28f52-f51d-4e67-8452-53a7f8061804")
    })

    // StrictMode mounts, unmounts and remounts every effect, so `fetchCart` runs twice. The
    // store's in-flight/dedup window must collapse that into a single HTTP request.
    it("issues only one HTTP request under StrictMode's double mount", async () => {
      const { result } = renderCartPageStrictMode()

      await waitFor(() => {
        expect(result.current.viewState).toBe("ready")
      })

      expect(recorder.cartGets).toBe(1)
    })

    it("reports an empty cart", async () => {
      cartResponse = makeCart({ cartItems: [] })
      const { result } = await renderReadyCartPage()

      expect(result.current.viewState).toBe("empty")
      expect(result.current.items).toEqual([])
      expect(result.current.totals.total).toBe(0)
    })

    it("surfaces a store error as an error toast", async () => {
      server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))
      renderCartPage()

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Cart unavailable", expect.any(String))
      })
    })
  })

  describe("quantity debounce", () => {
    it("collapses three rapid clicks into a single PUT carrying the last value", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })
      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })
      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })

      await waitFor(
        () => {
          expect(recorder.puts).toHaveLength(1)
        },
        { timeout: 3000 },
      )

      expect(recorder.puts[0]).toEqual({ userProductId: "up-1", quantity: 5, autoOrder: null })
    })

    it("shows the pending quantity optimistically before the request goes out", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })

      expect(result.current.items[0].quantity).toBe(3)
      expect(recorder.puts).toHaveLength(0)

      await waitFor(
        () => {
          expect(recorder.puts).toHaveLength(1)
        },
        { timeout: 3000 },
      )
    })

    it("recomputes the totals from the optimistic quantity", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })

      // price 56, shipmentFee 5, quantity 3
      expect(result.current.totals.subtotal).toBe(168)
      expect(result.current.totals.shipmentFee).toBe(15)

      await waitFor(
        () => {
          expect(recorder.puts).toHaveLength(1)
        },
        { timeout: 3000 },
      )
    })

    // The optimistic value is dropped once the write settles; because the store swallows the
    // failure and never refetches, the displayed quantity snaps back to the server's value.
    it("rolls the displayed quantity back when the PUT fails", async () => {
      putStatus = 500
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 3)
      })
      expect(result.current.items[0].quantity).toBe(5)

      await waitFor(
        () => {
          expect(result.current.items[0].quantity).toBe(2)
        },
        { timeout: 3000 },
      )

      expect(recorder.puts).toHaveLength(1)
      expect(mockToastError).toHaveBeenCalledWith("Cart unavailable", expect.any(String))
    })

    it("never sends a negative quantity", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, -5)
      })

      expect(result.current.items[0].quantity).toBe(0)

      // quantity 0 is routed to a removal by the store, not to a PUT.
      await waitFor(
        () => {
          expect(recorder.deleteItems).toHaveLength(1)
        },
        { timeout: 3000 },
      )
      expect(recorder.puts).toHaveLength(0)
    })

    it("debounces each line independently", async () => {
      cartResponse = makeCart({
        cartItems: [
          makeCartItem({ id: "ci-1", userProduct: makeCartUserProduct({ userProductId: "up-1" }) }),
          makeCartItem({ id: "ci-2", userProduct: makeCartUserProduct({ userProductId: "up-2" }) }),
        ],
      })
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })
      act(() => {
        result.current.onQuantityChange("up-2", 2, 4)
      })

      await waitFor(
        () => {
          expect(recorder.puts).toHaveLength(2)
        },
        { timeout: 3000 },
      )

      expect(recorder.puts.map((write) => [write.userProductId, write.quantity]).sort()).toEqual([
        ["up-1", 3],
        ["up-2", 6],
      ])
    })
  })

  describe("auto-order flush", () => {
    // Quantity and schedule share one endpoint and the backend replaces the schedule on every
    // write, so a still-debounced quantity edit must ride along in the auto-order write. This is
    // exactly why `cartCommands.setItemAutoOrder` accepts a `quantity` argument.
    it("flushes the pending quantity into the auto-order write instead of racing it", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })
      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })

      await act(async () => {
        await result.current.onAutoOrderChange("up-1", "ONE_MONTH")
      })

      expect(recorder.puts).toHaveLength(1)
      expect(recorder.puts[0]).toEqual({ userProductId: "up-1", quantity: 4, autoOrder: "ONE_MONTH" })

      // The cancelled debounce must not fire a second, schedule-clearing write afterwards.
      await settleDebounceWindow()
      expect(recorder.puts).toHaveLength(1)
    })

    it("sends the item's own quantity when nothing is pending", async () => {
      const { result } = await renderReadyCartPage()

      await act(async () => {
        await result.current.onAutoOrderChange("up-1", "TWO_WEEKS")
      })

      expect(recorder.puts).toEqual([{ userProductId: "up-1", quantity: 2, autoOrder: "TWO_WEEKS" }])
    })

    it("clears a schedule with a null period", async () => {
      cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })
      const { result } = await renderReadyCartPage()

      expect(result.current.autoOrderItemsCount).toBe(1)

      await act(async () => {
        await result.current.onAutoOrderChange("up-1", null)
      })

      expect(recorder.puts[0].autoOrder).toBeNull()
    })

    // `cartCommands.setItemAutoOrder` rethrows on failure, so the hook is still the only thing
    // standing between a failed write and an unhandled rejection - it toasts its own specific
    // message and then rethrows, callers MUST await/catch `onAutoOrderChange` or the rejection
    // escapes. Exactly ONE toast must appear: `writeErrorMessage` is silent for
    // `setItemAutoOrder`, so the generic write-error toast does not fire for it as well.
    it("toasts once and rethrows when the auto-order write fails", async () => {
      putStatus = 500
      const { result } = await renderReadyCartPage()

      await act(async () => {
        await expect(result.current.onAutoOrderChange("up-1", "ONE_MONTH")).rejects.toBeTruthy()
      })

      expect(mockToastError).toHaveBeenCalledWith("Could not update auto-reorder", expect.any(String))
      expect(mockToastError).not.toHaveBeenCalledWith("Cart unavailable", expect.any(String))
    })
  })

  describe("blocking alerts", () => {
    it("counts items carrying a blocking alert", async () => {
      cartResponse = makeCart({ cartItems: [makeCartItem(), blockedItem()] })
      const { result } = await renderReadyCartPage()

      expect(result.current.blockingItemsCount).toBe(1)
      expect(result.current.hasBlockingItems).toBe(true)
    })

    it("blocks checkout and explains why", async () => {
      cartResponse = makeCart({ cartItems: [blockedItem()] })
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onCheckout()
      })

      expect(getRouterMock().push).not.toHaveBeenCalled()
      expect(mockToastWarning).toHaveBeenCalledWith(
        "Checkout unavailable",
        "Please remove 1 unavailable item from your cart before checkout.",
      )
    })

    it("pluralises the blocking reason for several items", async () => {
      cartResponse = makeCart({
        cartItems: [
          blockedItem(),
          makeCartItem({ id: "ci-blocked-2", product: makeCartProductInfo({ productAlert: "Discontinued" }) }),
        ],
      })
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onCheckout()
      })

      expect(mockToastWarning).toHaveBeenCalledWith(
        "Checkout unavailable",
        "Please remove 2 unavailable items from your cart before checkout.",
      )
    })
  })

  describe("dental license gate", () => {
    it("does not block a cart that needs no license", async () => {
      const { result } = await renderReadyCartPage()

      expect(result.current.isLicenseBlocked).toBe(false)
    })

    it("blocks checkout when the cart needs a license and the only one on file was rejected", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: false })] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(true)
      })
      expect(result.current.licenseStatus).toBe("rejected")

      act(() => {
        result.current.onCheckout()
      })

      await waitFor(() => {
        expect(mockToastWarning).toHaveBeenCalledWith("Your dental license wasn't approved", expect.any(String))
      })
      expect(getRouterMock().push).not.toHaveBeenCalled()
    })

    it("blocks checkout when the only license is expired", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: true, expired: true })] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(true)
      })
    })

    it("lets an approved licence through to checkout", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(false)
      })

      act(() => {
        result.current.onCheckout()
      })

      await waitFor(() => {
        expect(getRouterMock().push).toHaveBeenCalledWith("/checkout")
      })
      expect(useCheckoutStore.getState().currentStep).toBe(2)
    })

    // SECURITY-RELEVANT BEHAVIOUR (locked in, not changed): the licence lookup is FAIL-CLOSED.
    // A 5xx from `GET /licenses` sets `hasValidLicense` to false, so a licence-gated cart cannot
    // reach checkout while the licence service is down. Safe default, but note it turns a backend
    // outage into a hard checkout block for every buyer holding a licence-gated item.
    // Y3: fail-closed is kept, but the two causes are now distinguishable so the UI can stop
    // telling an already-licensed buyer to "add your license" when the licence SERVICE is what
    // broke. `licenseCheckFailed` must be false on the happy path and on a genuine "no licence".
    it("flags the block as unverified when the licence lookup errors, not as a missing licence", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 500, licenses: [] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(true)
      })
      expect(result.current.licenseCheckFailed).toBe(true)
    })

    it("does not flag an unverified check when the buyer genuinely has no approved licence", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 200, licenses: [] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(true)
      })
      expect(result.current.licenseCheckFailed).toBe(false)
    })

    it("fails closed when the licence lookup errors", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 500, licenses: [] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(true)
      })

      act(() => {
        result.current.onCheckout()
      })

      await waitFor(() => {
        expect(mockToastWarning).toHaveBeenCalledWith("Couldn't verify your dental license", expect.any(String))
      })
      expect(getRouterMock().push).not.toHaveBeenCalled()
    })

    // THE RACE FIX: a buyer who clicks "Proceed to Checkout" before the background licence fetch
    // resolves must not slip through on the initial "not yet checked" render state. `onCheckout`
    // awaits `ensureChecked()` — the SAME in-flight request the mount effect started — so the
    // decision is always made from the settled result, never from a stale default.
    it("does not navigate when checkout is clicked before the license check resolves, if the buyer turns out unlicensed", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      let releaseLicenseResponse: (() => void) | undefined
      const licenseRequestGate = new Promise<void>((resolve) => {
        releaseLicenseResponse = resolve
      })
      server.use(
        http.get("*/backend-api/licenses", async () => {
          await licenseRequestGate
          return HttpResponse.json({ licenses: [makeLicense({ approved: false })], total: 1 })
        }),
      )

      // Cart items load (fast, separate endpoint) before the licence check has any chance to
      // settle — the licence request is still gated behind `licenseRequestGate`.
      const { result } = await renderReadyCartPage()
      expect(result.current.isLicenseBlocked).toBe(false)

      // Click while the licence lookup is still pending: this is exactly the window the old
      // `hasValidLicense === true` default used to leak a buyer through.
      act(() => {
        result.current.onCheckout()
      })

      // Must not have navigated yet — the click is awaiting the settled licence result.
      expect(getRouterMock().push).not.toHaveBeenCalled()

      // Now let the licence request resolve with "no valid licence".
      await act(async () => {
        releaseLicenseResponse?.()
        await licenseRequestGate
      })

      await waitFor(() => {
        expect(mockToastWarning).toHaveBeenCalledWith("Your dental license wasn't approved", expect.any(String))
      })
      expect(getRouterMock().push).not.toHaveBeenCalledWith("/checkout")
    })

    // REGRESSION: a failed licence lookup must be RETRIED on the next checkout click, not
    // replayed from a cached rejected promise. `useDentalLicenseGate`'s `.catch` branch nulls
    // out `requestRef` before returning, so every later `ensureChecked()` starts a FRESH
    // `getLicenses()` request instead of resolving the same settled failure forever. Without that
    // fix `recorder.licenseGets` would stay pinned at 1 forever (mount fetch only) and a buyer
    // would be stuck behind the first, transient failure with no way to recover short of a full
    // page reload — the final assertion group below is the one that would fail.
    it("retries the licence lookup on the next checkout click after a failed lookup, instead of replaying the cached failure", async () => {
      cartResponse = makeCart({ cartItems: [licensedItem()] })
      licenseResponse = { status: 500, licenses: [] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isLicenseBlocked).toBe(true)
      })
      expect(recorder.licenseGets).toBe(1)

      // First click: the mount fetch already failed and nulled `requestRef`, so this click also
      // retries (a fresh, second `getLicenses()` call) — which fails again since the service is
      // still down. Either way it must warn and NOT navigate.
      act(() => {
        result.current.onCheckout()
      })

      await waitFor(() => {
        expect(mockToastWarning).toHaveBeenCalledWith("Couldn't verify your dental license", expect.any(String))
      })
      expect(getRouterMock().push).not.toHaveBeenCalled()
      expect(recorder.licenseGets).toBe(2)

      mockToastWarning.mockClear()

      // The licence service recovers: the next lookup would resolve with an approved, non-expired
      // licence — but only if `ensureChecked()` actually issues a new request instead of awaiting
      // the stale rejected promise from either failed attempt above.
      licenseResponse = { status: 200, licenses: [makeLicense({ approved: true, expired: false })] }

      // Second click: must issue a NEW `getLicenses()` call rather than replaying a cached
      // failure. This is the exact behaviour the fix introduced.
      act(() => {
        result.current.onCheckout()
      })

      await waitFor(() => {
        expect(getRouterMock().push).toHaveBeenCalledWith("/checkout")
      })

      // A third, independent request went out — proof the failed lookup keeps being retried
      // rather than getting cached after the first failure.
      expect(recorder.licenseGets).toBe(3)
      expect(mockToastWarning).not.toHaveBeenCalled()
      expect(useCheckoutStore.getState().currentStep).toBe(2)
    })

    // The failed lookup only matters for carts that actually require a licence.
    it("does not block a licence-free cart when the licence lookup errors", async () => {
      licenseResponse = { status: 500, licenses: [] }
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onCheckout()
      })

      expect(result.current.isLicenseBlocked).toBe(false)
      expect(getRouterMock().push).toHaveBeenCalledWith("/checkout")
    })
  })

  describe("checkout", () => {
    it("advances the checkout step and navigates", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onCheckout()
      })

      expect(useCheckoutStore.getState().currentStep).toBe(2)
      expect(getRouterMock().push).toHaveBeenCalledWith("/checkout")
    })

    it("does nothing for an empty cart", async () => {
      cartResponse = makeCart({ cartItems: [] })
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onCheckout()
      })

      expect(getRouterMock().push).not.toHaveBeenCalled()
      expect(mockToastWarning).not.toHaveBeenCalled()
    })

    it("routes continue-shopping back to the storefront", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onContinueShopping()
      })

      expect(getRouterMock().push).toHaveBeenCalledWith("/")
    })
  })

  describe("removing items", () => {
    it("drops the last item and falls back to the empty view", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        cartResponse = makeCart({ cartItems: [] })
        result.current.onRemoveItem("up-1")
      })

      await waitFor(() => {
        expect(result.current.viewState).toBe("empty")
      })

      expect(recorder.deleteItems).toEqual([{ userProductId: "up-1" }])
    })

    it("cancels a pending quantity write for the removed line", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })
      act(() => {
        cartResponse = makeCart({ cartItems: [] })
        result.current.onRemoveItem("up-1")
      })

      await settleDebounceWindow()

      expect(recorder.puts).toHaveLength(0)
      expect(recorder.deleteItems).toHaveLength(1)
    })
  })

  describe("clearing the cart", () => {
    it("opens and closes the confirmation", async () => {
      const { result } = await renderReadyCartPage()

      expect(result.current.isClearConfirmOpen).toBe(false)

      act(() => {
        result.current.onOpenClearConfirm()
      })
      expect(result.current.isClearConfirmOpen).toBe(true)

      act(() => {
        result.current.onCloseClearConfirm()
      })
      expect(result.current.isClearConfirmOpen).toBe(false)
    })

    it("empties the cart, closes the confirmation and drops pending writes", async () => {
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onOpenClearConfirm()
        result.current.onQuantityChange("up-1", 2, 1)
      })

      await act(async () => {
        await result.current.onConfirmClearCart()
      })

      expect(recorder.cartDeletes).toBe(1)
      expect(result.current.items).toEqual([])
      expect(result.current.viewState).toBe("empty")
      expect(result.current.isClearConfirmOpen).toBe(false)

      await settleDebounceWindow()
      expect(recorder.puts).toHaveLength(0)
    })
  })

  describe("derived data", () => {
    it("groups items by seller and falls back to a standard seller label", async () => {
      cartResponse = makeCart({
        cartItems: [
          makeCartItem({ id: "ci-1", userProduct: makeCartUserProduct({ userProductId: "up-1" }) }),
          makeCartItem({
            id: "ci-2",
            userProduct: makeCartUserProduct({ userProductId: "up-2", sellerId: "seller-2", sellerName: "Beta Labs" }),
          }),
          makeCartItem({
            id: "ci-3",
            userProduct: makeCartUserProduct({ userProductId: "up-3", sellerId: "", sellerName: "" }),
          }),
        ],
      })
      const { result } = await renderReadyCartPage()

      expect(Object.keys(result.current.sellerGroups).sort()).toEqual(["Standard Seller", "seller-1", "seller-2"])
      expect(result.current.sellerGroups["seller-1"].items).toHaveLength(1)
      expect(result.current.sellerGroups["Standard Seller"].name).toBe("Standard Seller")
    })

    it("counts only the lines carrying a schedule", async () => {
      cartResponse = makeCart({
        cartItems: [
          makeCartItem({ id: "ci-1", autoOrder: "ONE_MONTH" }),
          makeCartItem({
            id: "ci-2",
            autoOrder: null,
            userProduct: makeCartUserProduct({ userProductId: "up-2" }),
          }),
        ],
      })
      const { result } = await renderReadyCartPage()

      expect(result.current.autoOrderItemsCount).toBe(1)
    })

    it("adds shipping and the heavy surcharge per unit and takes tax from the estimate", async () => {
      cartResponse = makeCart({
        cartItems: [
          makeCartItem({
            quantity: 3,
            userProduct: makeCartUserProduct({ price: 10, shipmentFee: 5, heavyShippingSurcharge: 2 }),
          }),
        ],
      })
      server.use(
        http.post("*/backend-api/cart/tax-estimate", () => HttpResponse.json(makeTaxEstimate({ taxAmount: 7 }))),
      )
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.totals.tax).toBe(7)
      })

      expect(result.current.totals.subtotal).toBe(30)
      expect(result.current.totals.shipmentFee).toBe(15)
      expect(result.current.totals.heavyShipmentFee).toBe(6)
      expect(result.current.totals.totalShipmentFee).toBe(21)
      expect(result.current.totals.total).toBe(58)
      expect(result.current.isTaxLoading).toBe(false)
    })

    // Backend: CartTaxEstimateRequest.shippingAmount is a Double (@NotNull @PositiveOrZero), not a
    // string. `String(shipping)` used to be sent instead, which only worked by accident.
    it("sends shippingAmount as a number, not a string", async () => {
      let capturedBody: unknown = null
      cartResponse = makeCart({
        cartItems: [
          makeCartItem({
            quantity: 2,
            userProduct: makeCartUserProduct({ price: 10, shipmentFee: 4, heavyShippingSurcharge: 1 }),
          }),
        ],
      })
      server.use(
        http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(makeTaxEstimate({ taxAmount: 7 }))
        }),
      )
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.totals.tax).toBe(7)
      })

      expect(capturedBody).toMatchObject({ shippingAmount: 10 })
      expect(typeof (capturedBody as { shippingAmount: unknown }).shippingAmount).toBe("number")
    })

    // A malformed 200 can carry `taxAmount` as a non-number. Storing it would skip the
    // "calculated at checkout" fallback and string-concatenate into the total, which
    // formatCurrency then floors to $0.00 - the buyer reads a wrong number either way.
    it.each([
      ["a string", "5"],
      ["null", null],
      ["an object", {}],
    ])("treats a non-numeric taxAmount (%s) as unestimated, not as a value", async (_label, taxAmount) => {
      server.use(
        http.post("*/backend-api/cart/tax-estimate", () =>
          HttpResponse.json({ subtotal: 100, shippingAmount: 0, taxAmount, totalAmount: 100, currency: "usd" }),
        ),
      )
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isTaxLoading).toBe(false)
      })

      expect(result.current.totals.tax).toBeNull()
      expect(result.current.totals.total).toBe(result.current.totals.subtotal + result.current.totals.totalShipmentFee)
    })

    it("treats a failed tax estimate as unestimated (null), not zero", async () => {
      server.use(http.post("*/backend-api/cart/tax-estimate", () => new HttpResponse(null, { status: 500 })))
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(result.current.isTaxLoading).toBe(false)
      })

      // Not 0 — a real $0 estimate and "we couldn't estimate it" must stay distinguishable so the
      // panel can show "calculated at checkout" instead of a misleading $0.00 tax line.
      expect(result.current.totals.tax).toBeNull()
      expect(result.current.totals.total).toBe(result.current.totals.subtotal + result.current.totals.totalShipmentFee)
    })

    it("never estimates tax when there is no address on file", async () => {
      addressResponse = { status: 200, addresses: [] }
      let taxCalls = 0
      server.use(
        http.post("*/backend-api/cart/tax-estimate", () => {
          taxCalls += 1
          return HttpResponse.json(makeTaxEstimate())
        }),
      )
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(recorder.addressGets).toBe(1)
      })

      expect(result.current.totals.tax).toBeNull()
      expect(result.current.isTaxLoading).toBe(false)
      expect(taxCalls).toBe(0)
    })

    // design doc §6: `placeholderData: keepPreviousData` - a new estimate (triggered here by a
    // quantity change, which shifts `linesSignature`) must not flash the tax line back to
    // "calculated at checkout" while the new number is in flight.
    it("keeps the previous tax estimate on screen while a new one is in flight", async () => {
      let call = 0
      let releaseSecondCall: (() => void) | undefined
      const secondCallGate = new Promise<void>((resolve) => {
        releaseSecondCall = resolve
      })
      server.use(
        http.post("*/backend-api/cart/tax-estimate", async () => {
          call += 1
          if (call === 2) {
            await secondCallGate
          }
          return HttpResponse.json(makeTaxEstimate({ taxAmount: call === 1 ? 5 : 9 }))
        }),
      )

      const { result } = await renderReadyCartPage()
      await waitFor(() => {
        expect(result.current.totals.tax).toBe(5)
      })

      // Bumps the quantity, which changes `linesSignature` (and therefore the tax-estimate query
      // key) immediately - independent of the 450ms write debounce.
      act(() => {
        result.current.onQuantityChange("up-1", 2, 1)
      })

      await waitFor(() => {
        expect(result.current.isTaxLoading).toBe(true)
      })
      expect(result.current.totals.tax).toBe(5)

      await act(async () => {
        releaseSecondCall?.()
        await secondCallGate
      })

      await waitFor(() => {
        expect(result.current.totals.tax).toBe(9)
      })
      expect(result.current.isTaxLoading).toBe(false)
    })

    it("picks the default address once at mount and keeps using it after the address list refetches", async () => {
      addressResponse = {
        status: 200,
        addresses: [
          makeAddress({ id: "addr-1", defaultAddress: true }),
          makeAddress({ id: "addr-2", defaultAddress: false }),
        ],
      }
      server.use(
        http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
          const body = (await request.json()) as { addressId: string }
          return HttpResponse.json(makeTaxEstimate({ taxAmount: body.addressId === "addr-1" ? 3 : 99 }))
        }),
      )

      const { result, client } = renderCartPageWithClient()
      await waitFor(() => {
        expect(result.current.totals.tax).toBe(3)
      })

      // The backend's default address flips to addr-2 and the list refetches - the page must
      // keep using the address it picked at mount, not silently switch mid-session.
      addressResponse = {
        status: 200,
        addresses: [
          makeAddress({ id: "addr-1", defaultAddress: false }),
          makeAddress({ id: "addr-2", defaultAddress: true }),
        ],
      }
      // `addressAPI` memoises `GET /address` for 2s regardless of React Query's own cache
      // settings - push the faked clock past that window so this refetch actually hits MSW.
      clockOffset += 3_000
      await act(async () => {
        await client.refetchQueries({ queryKey: queryKeys.addresses.list() })
      })
      await waitFor(() => {
        expect(recorder.addressGets).toBe(2)
      })

      expect(result.current.totals.tax).toBe(3)
    })

    it("does not toast when the default-address lookup fails - tax simply stays unestimated", async () => {
      addressResponse = { status: 500, addresses: [] }
      const { result } = await renderReadyCartPage()

      await waitFor(() => {
        expect(recorder.addressGets).toBe(1)
      })

      expect(result.current.totals.tax).toBeNull()
      expect(mockToastError).not.toHaveBeenCalled()
    })
  })

  describe("errors", () => {
    it("toasts the fetch failure exactly once", async () => {
      server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))
      renderCartPage()

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Cart unavailable", expect.any(String))
      })
      expect(mockToastError).toHaveBeenCalledTimes(1)
    })

    it("toasts once when removing an item fails", async () => {
      server.use(http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onRemoveItem("up-1")
      })

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Cart unavailable", expect.any(String))
      })
      expect(mockToastError).toHaveBeenCalledTimes(1)
    })

    // A real 401 drives the axios interceptor's `handleAuthFailure` (it flags the error
    // `authHandled` before this hook ever sees it) - the interceptor's own session teardown is
    // the only reaction, never this page's generic "Cart unavailable" toast.
    it("does not toast when the cart fetch fails with an auth-handled 401", async () => {
      useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")
      let cartGetAttempts = 0
      server.use(
        http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
        http.get("*/backend-api/cart", () => {
          cartGetAttempts += 1
          return new HttpResponse(null, { status: 401 })
        }),
      )

      renderCartPage()

      await waitFor(() => {
        expect(cartGetAttempts).toBeGreaterThan(0)
      })
      // Give the interceptor's async session teardown a turn to run before asserting silence.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockToastError).not.toHaveBeenCalled()
    })

    it("does not toast when removing an item fails with an auth-handled 401", async () => {
      useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")
      let deleteAttempts = 0
      server.use(
        http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
        http.delete("*/backend-api/cart/items", () => {
          deleteAttempts += 1
          return new HttpResponse(null, { status: 401 })
        }),
      )
      const { result } = await renderReadyCartPage()

      act(() => {
        result.current.onRemoveItem("up-1")
      })

      await waitFor(() => {
        expect(deleteAttempts).toBe(1)
      })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockToastError).not.toHaveBeenCalled()
    })
  })

  describe("write in-flight state", () => {
    // `runCartWrite` (cart-queries.ts) only counts the request itself as the mutation, so the
    // refreshed (now empty) cart lands with nothing left "in flight" - a write still pending
    // after the refresh would flash "loading" for a frame right as the last item leaves.
    it("moves straight from ready to empty when the last item is removed - no loading flash in between", async () => {
      const viewStateHistory: string[] = []
      const { wrapper } = createQueryWrapper()
      const { result } = renderHook(
        () => {
          const page = useCartPage()
          viewStateHistory.push(page.viewState)
          return page
        },
        { wrapper },
      )

      await waitFor(() => {
        expect(result.current.viewState).toBe("ready")
      })
      viewStateHistory.length = 0

      act(() => {
        cartResponse = makeCart({ cartItems: [] })
        result.current.onRemoveItem("up-1")
      })

      await waitFor(() => {
        expect(result.current.viewState).toBe("empty")
      })

      expect(result.current.items).toEqual([])
      expect(viewStateHistory).not.toContain("loading")
    })
  })
})
