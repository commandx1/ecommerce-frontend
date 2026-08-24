import { act, renderHook } from "@testing-library/react"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import type { GetPaymentStatusResponse, PlaceOrderPayload, PlaceOrderResponse } from "@/lib/api/orders"
import { ordersAPI } from "@/lib/api/orders"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartUserProduct } from "@/test/factories"
import type { FakeStripe } from "@/test/mocks/stripe"
import { stripeError, stripePaymentIntent } from "@/test/mocks/stripe"
import { useFinalReview } from "./useFinalReview"

/**
 * Step 4 — the only place in the app that moves real money.
 *
 * Shape of the flow: `POST /orders` creates the order and returns a Stripe client secret →
 * `stripe.confirmCardPayment` runs the charge (and any 3D Secure challenge) → the hook polls
 * `GET /orders/payment/:id` up to 3 times, 3s apart, for a terminal status → the order result is
 * written and the buyer is moved to the confirmation step.
 *
 * `@/lib/api/orders` is mocked (not MSW) so poll counts are exact, and only setTimeout is faked
 * so the two 3s waits inside `pollPaymentStatus` do not make this suite take six real seconds.
 */

vi.mock("@/lib/api/orders", () => ({
  ordersAPI: {
    placeOrder: vi.fn(),
    getPaymentStatus: vi.fn(),
    getSavedCards: vi.fn(),
  },
}))

const stripeState = vi.hoisted(() => ({ loaded: true, stripe: null as unknown }))

vi.mock("@stripe/react-stripe-js", async () => {
  const { createElementsMock, createFakeStripe, reactStripeMock } = await import("@/test/mocks/stripe")
  const stripe = createFakeStripe()
  stripeState.stripe = stripe
  // Same shape as `reactStripeNotLoadedMock()` when the flag is off — inlined so the accessors
  // stay plain functions instead of calls into another module's hooks.
  return {
    ...reactStripeMock(stripe),
    useStripe: () => (stripeState.loaded ? stripe : null),
    useElements: () => (stripeState.loaded ? createElementsMock() : null),
  }
})

const fakeStripe = () => stripeState.stripe as FakeStripe
const placeOrder = vi.mocked(ordersAPI.placeOrder)
const getPaymentStatus = vi.mocked(ordersAPI.getPaymentStatus)

const MAX_PAYMENT_STATUS_RETRIES = 3
/** Mirrors the hook's private `POLL_INTERVAL_MS`. */
const POLL_INTERVAL_MS_FOR_TEST = 3000
/** Two 3s waits between three attempts. */
const POLLING_BUDGET_MS = 10_000

const orderResponse = (overrides: Partial<PlaceOrderResponse> = {}): PlaceOrderResponse => ({
  orderId: "order-1",
  totalPrice: 112,
  status: "PENDING_PAYMENT",
  createdDate: "2026-08-22T10:00:00Z",
  clientSecret: "pi_1_secret_abc",
  orderItems: [],
  ...overrides,
})

const paymentStatus = (status: string): GetPaymentStatusResponse => ({
  paymentIntentId: "pi_1",
  status,
  amount: 11200,
  currency: "usd",
  clientSecret: "pi_1_secret_abc",
  error: null,
})

const apiError = (message: string, status = 409) => ({ response: { status, data: { message } } })

const orderPayload = (overrides: Partial<PlaceOrderPayload> = {}): PlaceOrderPayload => ({
  addressId: "address-1",
  shippoRateOrders: [
    { shippoRateId: "rate-1", userId: "seller-1", products: [{ userProductId: "up-1", quantity: 2 }] },
  ],
  uberRateOrders: [],
  ...overrides,
})

const autoOrderCartItem = () =>
  makeCartItem({ autoOrder: "ONE_MONTH", userProduct: makeCartUserProduct({ userProductId: "up-auto" }) })

/** Drives `onPlaceOrder` to completion, fast-forwarding through the polling waits. */
const placeAndSettle = async (onPlaceOrder: () => Promise<void>) => {
  await act(async () => {
    const pending = onPlaceOrder()
    await vi.advanceTimersByTimeAsync(POLLING_BUDGET_MS)
    await pending
  })
}

let errorToast: ReturnType<typeof vi.spyOn>
let successToast: ReturnType<typeof vi.spyOn>
let clearCart: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.restoreAllMocks()
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  stripeState.loaded = true

  const stripe = fakeStripe()
  stripe.confirmCardPayment.mockReset()
  stripe.confirmCardPayment.mockResolvedValue(stripePaymentIntent("succeeded", "pi_1"))

  placeOrder.mockReset()
  placeOrder.mockResolvedValue(orderResponse())
  getPaymentStatus.mockReset()
  getPaymentStatus.mockResolvedValue(paymentStatus("succeeded"))

  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
  successToast = vi.spyOn(showToast, "success").mockImplementation(() => undefined)

  clearCart = vi.fn().mockResolvedValue(undefined)
  useCartStore.setState({ cartId: "cart-1", items: [makeCartItem()], clearCart })
  useCheckoutStore.setState({
    currentStep: 4,
    orderPayload: orderPayload(),
    paymentMethod: { type: "card" },
    paymentMethodId: "pm_saved",
    selectedSavedCardId: "pm_saved",
    paymentMethodSummary: "VISA •••• 4242",
    termsAgreed: true,
  })
})

afterAll(() => {
  vi.useRealTimers()
})

describe("useFinalReview — happy path", () => {
  it("charges the card, resolves the status and moves to the confirmation step", async () => {
    const { result } = renderHook(() => useFinalReview())

    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(fakeStripe().confirmCardPayment).toHaveBeenCalledWith("pi_1_secret_abc", { payment_method: "pm_saved" })
    expect(getPaymentStatus).toHaveBeenCalledTimes(1)
    expect(successToast).toHaveBeenCalledWith("Order placed successfully. Order ID: order-1")
    expect(useCheckoutStore.getState().orderResult).toMatchObject({
      orderId: "order-1",
      status: "PAYMENT_SUCCESS",
      paymentStatus: "succeeded",
    })
    expect(useCheckoutStore.getState().currentStep).toBe(5)
    expect(result.current.isPlacingOrder).toBe(false)
  })

  it("snapshots the repeat lines before handing the buyer to the confirmation screen", async () => {
    useCartStore.setState({ items: [autoOrderCartItem(), makeCartItem({ id: "ci-plain" })] })
    const { result } = renderHook(() => useFinalReview())

    await placeAndSettle(result.current.onPlaceOrder)

    expect(useCheckoutStore.getState().autoOrderUserProductIds).toEqual(["up-auto"])
    // The cart is emptied by the confirmation screen, never by this hook — so a failed payment
    // (see below) cannot lose the buyer's basket.
    expect(clearCart).not.toHaveBeenCalled()
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it("exposes the payment method summary the review screen prints", () => {
    const { result } = renderHook(() => useFinalReview())

    expect(result.current.paymentMethodSummary).toBe("VISA •••• 4242")
  })

  // `requires_capture` (a manual-capture PaymentIntent awaiting the vendor's capture step) is as
  // successful as `succeeded` for order-status purposes, but the poll's OWN terminal check only
  // recognizes "succeeded"/"canceled" - so this exercises the fallback-to-Stripe's-status path,
  // not the poll's own terminal check.
  it("treats requires_capture as a successful charge", async () => {
    fakeStripe().confirmCardPayment.mockResolvedValue(stripePaymentIntent("requires_capture", "pi_1"))
    getPaymentStatus.mockResolvedValue(paymentStatus("requires_capture"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(MAX_PAYMENT_STATUS_RETRIES)
    expect(useCheckoutStore.getState().orderResult).toMatchObject({
      status: "PAYMENT_SUCCESS",
      paymentStatus: "requires_capture",
    })
  })
})

describe("useFinalReview — 3D Secure", () => {
  it("completes an order that needed a 3DS challenge, polling until the status is terminal", async () => {
    placeOrder.mockResolvedValue(orderResponse({ status: "requires_action" }))
    // confirmCardPayment resolves only after the buyer clears the bank's challenge
    fakeStripe().confirmCardPayment.mockResolvedValue(stripePaymentIntent("succeeded", "pi_1"))
    getPaymentStatus
      .mockResolvedValueOnce(paymentStatus("requires_confirmation"))
      .mockResolvedValueOnce(paymentStatus("processing"))
      .mockResolvedValue(paymentStatus("succeeded"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    // PENDING → PENDING → SUCCEEDED: exactly three attempts, and only one order.
    expect(getPaymentStatus).toHaveBeenCalledTimes(3)
    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(useCheckoutStore.getState().orderResult).toMatchObject({ status: "PAYMENT_SUCCESS" })
    expect(useCheckoutStore.getState().currentStep).toBe(5)
  })

  it("keeps the cart intact when the buyer abandons the 3DS challenge", async () => {
    fakeStripe().confirmCardPayment.mockResolvedValue(
      stripeError("We are unable to authenticate your payment method.", {
        code: "payment_intent_authentication_failure",
      }),
    )

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("We are unable to authenticate your payment method.")
    // The order is NOT confirmed and the buyer stays on step 4...
    expect(useCheckoutStore.getState().orderResult).toBeNull()
    expect(useCheckoutStore.getState().currentStep).toBe(4)
    // ...and above all, the basket survives so they can retry with another card.
    expect(clearCart).not.toHaveBeenCalled()
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().cartId).toBe("cart-1")
    expect(getPaymentStatus).not.toHaveBeenCalled()
  })

  /**
   * REGRESSION GUARD (K4): the auto-order snapshot used to be taken right after `placeOrder`
   * returns, i.e. BEFORE the charge was confirmed, so a 3DS abort left ids behind that the
   * confirmation screen would poll ~90s for. The schedules are only written after Stripe's
   * `payment_intent.succeeded` webhook, so the snapshot now happens only on a settled payment —
   * and any stale ids from an earlier attempt are cleared when a new order is placed.
   */
  it("does not snapshot the repeat lines when the payment was abandoned", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-stale"] })
    useCartStore.setState({ items: [autoOrderCartItem()] })
    fakeStripe().confirmCardPayment.mockResolvedValue(stripeError("3DS abandoned"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(useCheckoutStore.getState().autoOrderUserProductIds).toEqual([])
  })

  it("creates no order at all when the Stripe SDK never loaded", async () => {
    stripeState.loaded = false

    const { result } = renderHook(() => useFinalReview())
    expect(result.current.submitDisabled).toBe(true)

    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Stripe is not ready. Please refresh and try again.")
    expect(useCheckoutStore.getState().orderResult).toBeNull()
    expect(useCheckoutStore.getState().currentStep).toBe(4)
    // The charge can never happen without the SDK, so the order is not created either — no
    // orphaned, unpaid row and no pointless stock reservation.
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it("creates no order when the card payment method is missing", async () => {
    useCheckoutStore.setState({ paymentMethodId: "" })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith(
      "Payment details are missing. Please go back to Billing and re-enter your card.",
    )
    expect(placeOrder).not.toHaveBeenCalled()
    expect(fakeStripe().confirmCardPayment).not.toHaveBeenCalled()
  })
})

describe("useFinalReview — declines and failures", () => {
  it("keeps the buyer on step 4 with a message when the card is declined", async () => {
    fakeStripe().confirmCardPayment.mockResolvedValue(stripeError("Your card was declined.", { code: "card_declined" }))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Your card was declined.")
    expect(useCheckoutStore.getState().currentStep).toBe(4)
    expect(useCheckoutStore.getState().orderResult).toBeNull()
    expect(result.current.isPlacingOrder).toBe(false)
  })

  it("falls back to a generic message when Stripe gives no reason", async () => {
    fakeStripe().confirmCardPayment.mockResolvedValue({ error: {} })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Payment failed. Please try again.")
  })

  it("creates no order and never touches Stripe when the backend rejects with 409", async () => {
    placeOrder.mockRejectedValue(apiError("One or more items are out of stock"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("One or more items are out of stock")
    expect(fakeStripe().confirmCardPayment).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().orderResult).toBeNull()
    expect(useCheckoutStore.getState().currentStep).toBe(4)
    expect(clearCart).not.toHaveBeenCalled()
    expect(result.current.isPlacingOrder).toBe(false)
  })

  it("uses a generic message when the backend failure carries no body", async () => {
    placeOrder.mockRejectedValue(new Error("Network Error"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Failed to place order. Please try again.")
  })

  it("uses a generic message when the backend failure has a response but no body at all", async () => {
    // Distinct from the no-body-Error case above: here `response` itself is present (truthy),
    // so only the SECOND `?.` (before `.message`) is what stands between this and a crash.
    placeOrder.mockRejectedValue({ response: { status: 500 } })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Failed to place order. Please try again.")
  })

  it("refuses to start without an order payload", async () => {
    useCheckoutStore.setState({ orderPayload: null })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith(
      "Order information is missing. Please go back and review your shipping details.",
    )
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it("stops before creating the order when a card that must be saved has no name", async () => {
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "", paymentMethodId: "pm_new", cardName: "  " })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Please enter a card name to save this card.")
    expect(placeOrder).not.toHaveBeenCalled()
  })

  /**
   * The one unpaid-order case that cannot be prevented up front: only the `POST /orders` response
   * can reveal that no client secret was issued. The buyer is told the truth instead of getting a
   * vague toast, and the unpaid order is recorded so the state is distinguishable.
   */
  it("tells the buyer the order is unpaid when the backend returns no client secret", async () => {
    placeOrder.mockResolvedValue(orderResponse({ clientSecret: undefined }))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith(
      "Payment could not be initiated. Order order-1 was created but not paid — please contact support before trying again.",
    )
    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(fakeStripe().confirmCardPayment).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().orderResult).toMatchObject({
      orderId: "order-1",
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING_PAYMENT",
    })
    expect(useCheckoutStore.getState().currentStep).toBe(4)
  })

  it("bails out when Stripe returns neither an error nor a payment intent", async () => {
    fakeStripe().confirmCardPayment.mockResolvedValue({})

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith(
      "Payment could not be completed. Please use a different card and try again.",
    )
    expect(useCheckoutStore.getState().currentStep).toBe(4)
  })

  it("still reaches the confirmation screen, flagged as failed, when the intent is canceled", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("canceled"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(errorToast).toHaveBeenCalledWith("Order placed but payment was canceled. Order ID: order-1")
    expect(useCheckoutStore.getState().orderResult).toMatchObject({
      status: "PAYMENT_FAILED",
      paymentStatus: "canceled",
    })
    expect(useCheckoutStore.getState().currentStep).toBe(5)
  })
})

describe("useFinalReview — status polling", () => {
  it("stops polling as soon as a terminal status arrives", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("succeeded"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(1)
  })

  it("normalises the backend's casing before deciding a status is terminal", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("SUCCEEDED"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(1)
    expect(useCheckoutStore.getState().orderResult).toMatchObject({ status: "PAYMENT_SUCCESS" })
  })

  it("gives up after three attempts and falls back to Stripe's own intent status", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("requires_confirmation"))
    fakeStripe().confirmCardPayment.mockResolvedValue(stripePaymentIntent("processing", "pi_1"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(MAX_PAYMENT_STATUS_RETRIES)
    // The whole point: a slow webhook must not produce a second charge.
    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(fakeStripe().confirmCardPayment).toHaveBeenCalledTimes(1)
    expect(useCheckoutStore.getState().orderResult).toMatchObject({
      status: "PAYMENT_PROCESSING",
      paymentStatus: "processing",
    })
  })

  it("waits for a real timer between attempts instead of retrying immediately", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("requires_confirmation"))

    const { result } = renderHook(() => useFinalReview())
    let pending: Promise<void> | undefined
    await act(async () => {
      pending = result.current.onPlaceOrder()
      // Flushes only pending microtasks (the order creation call, the first status poll) -
      // no fake time is advanced, so a second attempt can only have fired if `wait()` failed to
      // schedule a real timer between attempts.
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(getPaymentStatus).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLLING_BUDGET_MS)
      await pending
    })
  })

  it("finishes exactly two wait-cycles after three failed attempts, with no superfluous wait after the last one", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("requires_confirmation"))
    fakeStripe().confirmCardPayment.mockResolvedValue(stripePaymentIntent("processing", "pi_1"))

    const { result } = renderHook(() => useFinalReview())
    let pending: Promise<void> | undefined
    act(() => {
      pending = result.current.onPlaceOrder()
    })

    // Exactly two 3s waits separate three attempts (1→2, 2→3); nothing should still be pending
    // after that, and above all the hook must not still be waiting on a fourth cycle.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * POLL_INTERVAL_MS_FOR_TEST)
    })

    expect(getPaymentStatus).toHaveBeenCalledTimes(MAX_PAYMENT_STATUS_RETRIES)
    expect(result.current.isPlacingOrder).toBe(false)

    await act(async () => {
      await pending
    })
  })

  it("marks the order pending payment when neither the poll nor Stripe reached a good state", async () => {
    getPaymentStatus.mockResolvedValue(paymentStatus("requires_confirmation"))
    fakeStripe().confirmCardPayment.mockResolvedValue(stripePaymentIntent("requires_payment_method", "pi_1"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(useCheckoutStore.getState().orderResult).toMatchObject({ status: "PENDING_PAYMENT" })
    expect(placeOrder).toHaveBeenCalledTimes(1)
  })

  /**
   * An expired session must never be read as a successful payment: the poll stops on the first
   * 401 instead of burning its attempts and falling back to Stripe's optimistic status.
   */
  it("stops polling on a 401 and refuses to mark the order paid", async () => {
    getPaymentStatus.mockRejectedValue(apiError("Unauthorized", 401))
    fakeStripe().confirmCardPayment.mockResolvedValue(stripePaymentIntent("succeeded", "pi_1"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(1)
    expect(errorToast).toHaveBeenCalledWith(
      "Your session expired before the payment could be confirmed. Order order-1 is not confirmed — please sign in again and check it before paying twice.",
    )
    expect(successToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().orderResult).toMatchObject({
      status: "PENDING_PAYMENT",
      paymentStatus: "unknown",
    })
    expect(useCheckoutStore.getState().orderResult?.status).not.toBe("PAYMENT_SUCCESS")
    // The axios interceptor owns the logout/redirect — the hook just stops here.
    expect(useCheckoutStore.getState().currentStep).toBe(4)
  })

  it("stops polling the same way when the interceptor already handled the auth error", async () => {
    getPaymentStatus.mockRejectedValue(Object.assign(new Error("Unauthorized"), { authHandled: true }))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(1)
    expect(useCheckoutStore.getState().orderResult).toMatchObject({ status: "PENDING_PAYMENT" })
  })

  it("recovers when only the first poll fails", async () => {
    getPaymentStatus.mockRejectedValueOnce(apiError("Bad gateway", 502)).mockResolvedValue(paymentStatus("succeeded"))

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(getPaymentStatus).toHaveBeenCalledTimes(2)
    expect(useCheckoutStore.getState().orderResult).toMatchObject({ status: "PAYMENT_SUCCESS" })
    // Transient failures are logged, not swallowed silently.
    // biome-ignore lint/suspicious/noConsole: asserting on the spied console.warn call itself
    expect(console.warn).toHaveBeenCalledWith("Payment status polling attempt failed", expect.anything())
  })
})

describe("useFinalReview — double submit", () => {
  /** A promise the test resolves by hand, so the in-flight window stays observable. */
  const deferred = () => {
    let resolve!: (value: PlaceOrderResponse) => void
    const promise = new Promise<PlaceOrderResponse>((res) => {
      resolve = res
    })
    return { promise, resolve }
  }

  it("allows a fresh order after a previous one fully completed", async () => {
    const { result } = renderHook(() => useFinalReview())

    await placeAndSettle(result.current.onPlaceOrder)
    expect(placeOrder).toHaveBeenCalledTimes(1)

    await placeAndSettle(result.current.onPlaceOrder)
    expect(placeOrder).toHaveBeenCalledTimes(2)
  })

  it("uses the current cartId instead of a stale one captured on the first render", async () => {
    const { result, rerender } = renderHook(() => useFinalReview())

    act(() => {
      useCartStore.setState({ cartId: "cart-2" })
    })
    rerender()

    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0].cartId).toBe("cart-2")
  })

  it("disables the submit button for the whole in-flight order", async () => {
    const inFlight = deferred()
    placeOrder.mockReturnValue(inFlight.promise)

    const { result } = renderHook(() => useFinalReview())
    expect(result.current.submitDisabled).toBe(false)

    let pending: Promise<void> | undefined
    await act(async () => {
      pending = result.current.onPlaceOrder()
    })

    expect(result.current.isPlacingOrder).toBe(true)
    expect(result.current.submitDisabled).toBe(true)

    await act(async () => {
      inFlight.resolve(orderResponse())
      await vi.advanceTimersByTimeAsync(POLLING_BUDGET_MS)
      await pending
    })

    expect(result.current.isPlacingOrder).toBe(false)
    expect(result.current.submitDisabled).toBe(false)
  })

  it("places exactly one order when the button is tapped twice, because the second tap is disabled", async () => {
    const inFlight = deferred()
    placeOrder.mockReturnValue(inFlight.promise)

    const { result } = renderHook(() => useFinalReview())

    let pending: Promise<void> | undefined
    await act(async () => {
      pending = result.current.onPlaceOrder()
    })

    // What a second tap on the real button does: nothing, the control is disabled.
    expect(result.current.submitDisabled).toBe(true)
    await act(async () => {
      if (!result.current.submitDisabled) {
        await result.current.onPlaceOrder()
      }
      inFlight.resolve(orderResponse())
      await vi.advanceTimersByTimeAsync(POLLING_BUDGET_MS)
      await pending
    })

    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(fakeStripe().confirmCardPayment).toHaveBeenCalledTimes(1)
  })

  /**
   * The hook defends itself: anything that calls `onPlaceOrder` directly (a form `onSubmit`, an
   * Enter key, a component that forgets to read `submitDisabled`) can no longer create a SECOND
   * order and a second charge. The request still carries no idempotency key, hence the ref guard.
   */
  it("ignores a direct re-entrant call instead of placing a second order", async () => {
    const { result } = renderHook(() => useFinalReview())

    await act(async () => {
      const first = result.current.onPlaceOrder()
      const second = result.current.onPlaceOrder()
      await vi.advanceTimersByTimeAsync(POLLING_BUDGET_MS)
      await Promise.all([first, second])
    })

    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(fakeStripe().confirmCardPayment).toHaveBeenCalledTimes(1)
  })

  it("ignores a second call fired while the first order is still in flight", async () => {
    const inFlight = deferred()
    placeOrder.mockReturnValueOnce(inFlight.promise).mockResolvedValue(orderResponse({ orderId: "order-2" }))

    const { result } = renderHook(() => useFinalReview())

    let pending: Promise<void> | undefined
    await act(async () => {
      pending = result.current.onPlaceOrder()
    })

    // A caller that ignores `submitDisabled` entirely still cannot double-charge.
    await act(async () => {
      await result.current.onPlaceOrder()
    })
    expect(placeOrder).toHaveBeenCalledTimes(1)

    await act(async () => {
      inFlight.resolve(orderResponse())
      await vi.advanceTimersByTimeAsync(POLLING_BUDGET_MS)
      await pending
    })

    expect(placeOrder).toHaveBeenCalledTimes(1)
    expect(fakeStripe().confirmCardPayment).toHaveBeenCalledTimes(1)
    // The guard releases afterwards, so a genuine retry still works.
    expect(result.current.submitDisabled).toBe(false)
  })

  it("blocks submission while the card details are missing", () => {
    useCheckoutStore.setState({ paymentMethodId: "" })

    const { result } = renderHook(() => useFinalReview())

    expect(result.current.submitDisabled).toBe(true)
  })

  it("does not disable submission for a non-card payment method even when Stripe never loaded", () => {
    stripeState.loaded = false
    useCheckoutStore.setState({ paymentMethod: { type: "net30" } })

    const { result } = renderHook(() => useFinalReview())

    expect(result.current.submitDisabled).toBe(false)
  })

  it("does not disable submission for a non-card payment method even when paymentMethodId is empty", () => {
    useCheckoutStore.setState({ paymentMethod: { type: "net30" }, paymentMethodId: "" })

    const { result } = renderHook(() => useFinalReview())

    expect(result.current.submitDisabled).toBe(false)
  })

  /**
   * KNOWN GAP: step 4 never re-checks `termsAgreed` — the only gate is step 3
   * (`useBillingInformation`). Reaching this hook with the flag cleared still places the order.
   */
  it("does not re-check the terms checkbox at the review step", async () => {
    useCheckoutStore.setState({ termsAgreed: false })

    const { result } = renderHook(() => useFinalReview())
    expect(result.current.submitDisabled).toBe(false)

    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder).toHaveBeenCalledTimes(1)
  })
})

describe("useFinalReview — payload", () => {
  it("sends the cart id and the saved card as a plain paymentMethodId", async () => {
    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    const payload = placeOrder.mock.calls[0][0]
    expect(payload).toMatchObject({
      addressId: "address-1",
      cartId: "cart-1",
      paymentMethodId: "pm_saved",
      cardSave: false,
      cardName: "",
    })
    // There is no `savedCardId` field in the contract, and no tax-exemption flag is sent even
    // though the store carries `applyTaxExemption`.
    expect(payload).not.toHaveProperty("savedCardId")
    expect(payload).not.toHaveProperty("applyTaxExemption")
    expect(payload).not.toHaveProperty("taxExempt")
  })

  it("saves a new card with the buyer's off-session consent", async () => {
    useCheckoutStore.setState({
      selectedSavedCardId: "",
      paymentMethodId: "pm_new",
      saveCard: true,
      cardName: "  Clinic Visa  ",
      newCardAutoPaymentConsent: true,
    })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).toMatchObject({
      paymentMethodId: "pm_new",
      cardSave: true,
      cardName: "Clinic Visa",
      cardOpenToAutoPayment: true,
      cardAutoOrderCard: true,
    })
  })

  it("forces a new card to be saved with an off-session mandate when the cart repeats", async () => {
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({
      selectedSavedCardId: "",
      paymentMethodId: "pm_new",
      saveCard: false,
      cardName: "Clinic Visa",
      newCardAutoPaymentConsent: false,
    })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).toMatchObject({
      cardSave: true,
      cardOpenToAutoPayment: true,
      cardAutoOrderCard: true,
    })
  })

  it("does not open a new card to off-session payments when nothing needs it", async () => {
    // Default cart (from beforeEach) has no auto-order items, and consent is off.
    useCheckoutStore.setState({
      selectedSavedCardId: "",
      paymentMethodId: "pm_new",
      saveCard: true,
      cardName: "Clinic Visa",
      newCardAutoPaymentConsent: false,
    })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).toMatchObject({
      cardOpenToAutoPayment: false,
      cardAutoOrderCard: false,
    })
  })

  it("upgrades a saved card to off-session only when the buyer consented", async () => {
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: true })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).toMatchObject({ openToAutoOrder: true, cardSave: false })
  })

  it("omits the off-session upgrade when consent was not given", async () => {
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: false })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).not.toHaveProperty("openToAutoOrder")
  })

  it("never sets the off-session upgrade flag for a brand-new card, even with auto-order consent", async () => {
    // `openToAutoOrder` upgrades an EXISTING saved card; a brand-new card already gets its
    // off-session mandate through `cardOpenToAutoPayment` above, so this must stay unset.
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({
      selectedSavedCardId: "",
      paymentMethodId: "pm_new",
      cardName: "Clinic Visa",
      autoOrderConsent: true,
    })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).not.toHaveProperty("openToAutoOrder")
  })

  it("does not set the off-session upgrade flag for a saved card when the cart has no repeat items", async () => {
    // Default cart (from beforeEach) has no auto-order items.
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: true })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0]).not.toHaveProperty("openToAutoOrder")
  })

  it("sends an empty cart id rather than undefined when the cart id is missing", async () => {
    useCartStore.setState({ cartId: null })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(placeOrder.mock.calls[0][0].cartId).toBe("")
  })

  it("skips every card-specific field for a non-card payment method", async () => {
    useCheckoutStore.setState({ paymentMethod: { type: "net30" } })

    const { result } = renderHook(() => useFinalReview())
    await placeAndSettle(result.current.onPlaceOrder)

    expect(fakeStripe().confirmCardPayment).not.toHaveBeenCalled()
    expect(getPaymentStatus).not.toHaveBeenCalled()
    expect(placeOrder.mock.calls[0][0]).not.toHaveProperty("cardSave")
    expect(useCheckoutStore.getState().orderResult).toMatchObject({ status: "PENDING_PAYMENT" })
    expect(useCheckoutStore.getState().currentStep).toBe(5)
    // `isPaymentCanceled` only gets set inside the card-only confirmation block, so a non-card
    // order must still take the success path off its untouched `false` initial value.
    expect(successToast).toHaveBeenCalledWith("Order placed successfully. Order ID: order-1")
    expect(errorToast).not.toHaveBeenCalled()
  })
})
