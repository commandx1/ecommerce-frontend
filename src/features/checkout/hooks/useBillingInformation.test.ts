import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import type { SavedCard } from "@/lib/api/orders"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeApiSavedCard, makeCartItem, makeCartUserProduct } from "@/test/factories"
import type { FakeStripe } from "@/test/mocks/stripe"
import { stripeError, stripePaymentMethod } from "@/test/mocks/stripe"
import { useBillingInformation } from "./useBillingInformation"

/**
 * Step 3: the card. Nothing here charges anything yet — it turns the buyer's input into a
 * `paymentMethodId` that `useFinalReview` later hands to Stripe.
 *
 * The Stripe SDK never throws for a bad card; it resolves with `{ error: {...} }`. Every
 * declined/invalid-card case below therefore asserts that the store is left untouched.
 *
 * `stripeState.loaded` flips the mocked `useStripe()` / `useElements()` to null so the
 * "SDK has not finished loading" branch is reachable without a second mock factory.
 */

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

const serveSavedCards = (cards: SavedCard[]) => {
  server.use(http.get("*/backend-api/orders/saved-cards", () => HttpResponse.json({ cards, total: cards.length })))
}

const serveSavedCardsError = (message: string, status = 400) => {
  server.use(http.get("*/backend-api/orders/saved-cards", () => HttpResponse.json({ message }, { status })))
}

const savedCard = (overrides: Partial<SavedCard> = {}): SavedCard =>
  ({ ...makeApiSavedCard(), ...overrides }) as unknown as SavedCard

const autoOrderCartItem = () =>
  makeCartItem({ autoOrder: "ONE_MONTH", userProduct: makeCartUserProduct({ userProductId: "up-auto" }) })

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent

const mountHook = async () => {
  const rendered = renderHook(() => useBillingInformation())
  await waitFor(() => expect(rendered.result.current.isLoadingCards).toBe(false))
  return rendered
}

const submit = async (onSubmit: (event: React.FormEvent) => void) => {
  await act(async () => {
    await (onSubmit(submitEvent()) as unknown as Promise<void>)
  })
}

let errorToast: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.restoreAllMocks()
  stripeState.loaded = true
  const stripe = fakeStripe()
  stripe.createPaymentMethod.mockReset()
  stripe.createPaymentMethod.mockResolvedValue(stripePaymentMethod("pm_new_card"))
  errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
  useCartStore.setState({ cartId: "cart-1", items: [makeCartItem()] })
  useCheckoutStore.setState({ termsAgreed: true })
  serveSavedCards([])
})

describe("useBillingInformation — saved card loading", () => {
  it("offers the new-card form when the buyer has no saved cards", async () => {
    const { result } = await mountHook()

    expect(result.current.savedCards).toEqual([])
    expect(result.current.selectedSavedCardId).toBe("")
  })

  it("exposes the saved cards, with the default one first as the backend ordered them", async () => {
    serveSavedCards([savedCard({ id: "c1", stripeCardId: "pm_default", isDefault: true }), savedCard({ id: "c2" })])

    const { result } = await mountHook()

    expect(result.current.savedCards.map((card) => card.id)).toEqual(["c1", "c2"])
    expect(result.current.savedCards[0].isDefault).toBe(true)
  })

  it("treats the backend's 'No active cards' response as an empty list, not an error", async () => {
    serveSavedCardsError("No active cards found for this user")

    const { result } = await mountHook()

    expect(result.current.savedCards).toEqual([])
    expect(errorToast).not.toHaveBeenCalled()
  })

  it("reports a genuine saved-card lookup failure", async () => {
    serveSavedCardsError("Internal error", 500)

    await mountHook()

    expect(errorToast).toHaveBeenCalledWith("Failed to load saved cards.")
  })

  it("does not look up cards for a non-card payment method", async () => {
    let requested = false
    server.use(
      http.get("*/backend-api/orders/saved-cards", () => {
        requested = true
        return HttpResponse.json({ cards: [], total: 0 })
      }),
    )
    useCheckoutStore.setState({ paymentMethod: { type: "wire" } })

    const { result } = renderHook(() => useBillingInformation())

    await waitFor(() => expect(result.current.paymentType).toBe("wire"))
    expect(requested).toBe(false)
  })

  /**
   * KNOWN GAP (checkoutStore): switching to a non-card payment method leaves
   * `paymentMethodId` / `selectedSavedCardId` behind, and this hook does NOT compensate.
   * Locked in so a future fix has to update this expectation deliberately.
   */
  it("leaves a stale card id in the store after switching away from card payment", async () => {
    useCheckoutStore.setState({
      paymentMethod: { type: "net30" },
      paymentMethodId: "pm_leftover",
      selectedSavedCardId: "pm_leftover",
    })

    const { result } = renderHook(() => useBillingInformation())

    expect(result.current.selectedSavedCardId).toBe("pm_leftover")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_leftover")
  })
})

describe("useBillingInformation — submit guards", () => {
  it("does nothing at all until the terms are accepted", async () => {
    useCheckoutStore.setState({ termsAgreed: false })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(1)
    expect(errorToast).not.toHaveBeenCalled()
  })

  it("refuses to submit while the Stripe SDK has not loaded", async () => {
    stripeState.loaded = false
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Stripe is not ready. Please refresh and try again.")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })

  it("advances a non-card payment method without touching Stripe", async () => {
    useCheckoutStore.setState({ paymentMethod: { type: "wire" } })
    const { result } = renderHook(() => useBillingInformation())

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })
})

describe("useBillingInformation — new card", () => {
  it("stores the payment method id and a readable summary on success", async () => {
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).toHaveBeenCalledTimes(1)
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_new_card")
    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("VISA •••• 4242")
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("keeps the buyer on billing and stores nothing when the card is declined", async () => {
    fakeStripe().createPaymentMethod.mockResolvedValue(
      stripeError("Your card was declined.", { code: "card_declined" }),
    )
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Your card was declined.")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })

  it("surfaces a field-level validation error the same way, without advancing", async () => {
    fakeStripe().createPaymentMethod.mockResolvedValue(
      stripeError("Your card number is incomplete.", { type: "validation_error", code: "incomplete_number" }),
    )
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Your card number is incomplete.")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })

  it("falls back to a generic message when Stripe returns an error with no message", async () => {
    fakeStripe().createPaymentMethod.mockResolvedValue({ error: {} })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Card details are invalid.")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
  })

  /**
   * RISK, locked in as-is: a *network* failure inside `stripe.createPaymentMethod` is not a
   * Stripe error object, it is a rejected promise — and `onSubmit` has no try/catch, so the
   * rejection escapes the handler. The buyer sees no toast and no spinner reset.
   */
  it("lets a network rejection escape onSubmit instead of showing an error", async () => {
    fakeStripe().createPaymentMethod.mockRejectedValue(new Error("Network request failed"))
    const { result } = await mountHook()

    await expect(result.current.onSubmit(submitEvent()) as unknown as Promise<void>).rejects.toThrow(
      "Network request failed",
    )
    expect(errorToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
  })

  it("requires a card name before a card may be saved", async () => {
    useCheckoutStore.setState({ saveCard: true, cardName: "   " })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Please enter a card name to save this card.")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })

  it("forces the card to be saved when the cart contains repeat items", async () => {
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ saveCard: false, cardName: "Clinic Amex" })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(useCheckoutStore.getState().saveCard).toBe(true)
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_new_card")
  })

  it("keeps saveCard off — and so the auto-payment consent irrelevant — for a plain one-off cart", async () => {
    const { result } = await mountHook()

    expect(result.current.hasAutoOrderItems).toBe(false)
    expect(result.current.saveCard).toBe(false)
    expect(result.current.newCardAutoPaymentConsent).toBe(false)
  })
})

describe("useBillingInformation — saved card", () => {
  it("uses the saved card id as the payment method and stops offering to save it", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", brand: "mastercard", last4: "0007" })])
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", saveCard: true })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_saved")
    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("MASTERCARD •••• 0007")
    expect(useCheckoutStore.getState().saveCard).toBe(false)
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("blocks a repeat order on a card with no off-session mandate until consent is ticked", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", openToAutoPayment: false })])
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: false })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith(
      "Automatic payments not allowed yet",
      "Allow this card to be charged automatically, or remove the repeat items from your cart.",
    )
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })

  it("lets the same order through once the buyer consents", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", openToAutoPayment: false })])
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: true })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_saved")
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("asks for nothing extra when the saved card is already open to auto payments", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", openToAutoPayment: true })])
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: false })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_saved")
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("falls back to a neutral summary when the selected id is not in the loaded list", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_other" })])
    useCheckoutStore.setState({ selectedSavedCardId: "pm_missing" })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("Saved card")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_missing")
  })
})
