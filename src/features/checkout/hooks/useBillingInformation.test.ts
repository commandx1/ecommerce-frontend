import type { QueryClient } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import type { SavedCard } from "@/lib/api/orders"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { type PendingNewCard, useCheckoutStore } from "@/stores/checkoutStore"
import { makeApiSavedCard, makeCartItem, makeCartUserProduct } from "@/test/factories"
import type { FakeStripe } from "@/test/mocks/stripe"
import { stripeError, stripePaymentMethod } from "@/test/mocks/stripe"
import { createQueryWrapper } from "@/test/render"
import { useBillingInformation } from "./useBillingInformation"

/**
 * Step 3: the card. Nothing here charges anything yet — it turns the buyer's input into a
 * `paymentMethodId` that `useFinalReview` later hands to Stripe.
 *
 * A tokenized-but-unsubmitted new card lives in the store as `pendingNewCard` — it survives a
 * round trip to step 4 and back, so the buyer is never asked to re-enter card details they
 * already typed once (`selectedSavedCardId === ""` still means "using a new card", pending or not).
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

const pendingCard = (overrides: Partial<PendingNewCard> = {}): PendingNewCard => ({
  paymentMethodId: "pm_pending",
  brand: "visa",
  last4: "4242",
  expMonth: 9,
  expYear: 2099,
  ...overrides,
})

const autoOrderCartItem = () =>
  makeCartItem({ autoOrder: "ONE_MONTH", userProduct: makeCartUserProduct({ userProductId: "up-auto" }) })

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent

/**
 * `useBillingInformation` reads `hasAutoOrderItems` off `useCheckoutAutoOrder`, which is a
 * disabled reader on the `cart.detail` query cache (design doc §7 step 5) - so every mount needs
 * a `QueryClientProvider`, and the cache has to carry whatever `items` the test already put into
 * `cartStore` (read synchronously here, right before render, so a test's own
 * `useCartStore.setState({ items })` - always called before `mountHook()` - lands in both places).
 */
const mountHook = async () => {
  const { wrapper, client } = createQueryWrapper()
  const { cartId, items } = useCartStore.getState()
  client.setQueryData(queryKeys.cart.detail(), { cartId, cartItems: items })
  const rendered = renderHook(() => useBillingInformation(), { wrapper })
  await waitFor(() => expect(rendered.result.current.isLoadingCards).toBe(false))
  return { ...rendered, client }
}

const refetchSavedCards = async (client: QueryClient) => {
  await act(async () => {
    await client.refetchQueries({ queryKey: queryKeys.paymentMethods.checkoutSavedCards() })
  })
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
    expect(result.current.showInlineNewCardForm).toBe(true)
  })

  it("exposes the saved cards, with the default one first as the backend ordered them", async () => {
    serveSavedCards([savedCard({ id: "c1", stripeCardId: "pm_default", isDefault: true }), savedCard({ id: "c2" })])

    const { result } = await mountHook()

    expect(result.current.savedCards.map((card) => card.id)).toEqual(["c1", "c2"])
    expect(result.current.savedCards[0].isDefault).toBe(true)
  })

  // `|| []` only catches null/undefined. A malformed 200 carrying a wrong-typed truthy value
  // passes through it and reaches .map() in the saved-card picker, blanking the payment step
  // (infra note #26 - the same root pattern found in twelve other modules this week).
  it.each([
    ["an object", { nope: true }],
    ["a string", "nope"],
    ["a number", 2],
  ])("falls back to the new-card form instead of crashing when cards is %s", async (_label, cards) => {
    server.use(http.get("*/backend-api/orders/saved-cards", () => HttpResponse.json({ cards, total: 0 })))

    const { result } = await mountHook()

    expect(result.current.savedCards).toEqual([])
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

  it("reports a failure only once per mount, even if a later refetch fails again", async () => {
    serveSavedCardsError("Internal error", 500)
    const { client } = await mountHook()

    await refetchSavedCards(client)
    expect(client.getQueryState(queryKeys.paymentMethods.checkoutSavedCards())?.errorUpdateCount).toBe(2)

    expect(errorToast).toHaveBeenCalledTimes(1)
  })

  it("starts out loading, before the lookup has even been sent", () => {
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useBillingInformation(), { wrapper })

    expect(result.current.isLoadingCards).toBe(true)
  })

  it("looks up saved cards exactly once per mount", async () => {
    let requests = 0
    server.use(
      http.get("*/backend-api/orders/saved-cards", () => {
        requests += 1
        return HttpResponse.json({ cards: [], total: 0 })
      }),
    )

    const { unmount } = await mountHook()
    expect(requests).toBe(1)

    unmount()
    await mountHook()
    expect(requests).toBe(2)
  })

  it("looks up saved cards on mount", async () => {
    let requested = false
    server.use(
      http.get("*/backend-api/orders/saved-cards", () => {
        requested = true
        return HttpResponse.json({ cards: [], total: 0 })
      }),
    )

    await mountHook()

    expect(requested).toBe(true)
  })
})

describe("useBillingInformation — initial card pre-selection", () => {
  it("pre-selects the default card when it is still valid", async () => {
    serveSavedCards([
      savedCard({ stripeCardId: "pm_a", isDefault: false }),
      savedCard({ stripeCardId: "pm_b", isDefault: true }),
    ])

    const { result } = await mountHook()

    expect(result.current.selectedSavedCardId).toBe("pm_b")
  })

  it("skips an expired default and pre-selects the next usable card", async () => {
    serveSavedCards([
      savedCard({ stripeCardId: "pm_default", isDefault: true, expMonth: 1, expYear: 2000 }),
      savedCard({ stripeCardId: "pm_b" }),
    ])

    const { result } = await mountHook()

    expect(result.current.selectedSavedCardId).toBe("pm_b")
  })

  it("never overwrites a selection the buyer already made (e.g. stepping back from step 4)", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_a" }), savedCard({ stripeCardId: "pm_b", isDefault: true })])
    useCheckoutStore.setState({ selectedSavedCardId: "pm_a" })

    const { result } = await mountHook()

    expect(result.current.selectedSavedCardId).toBe("pm_a")
  })

  it("pre-selects only once per mount, never again when the cards are refetched", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_a", isDefault: true })])
    const { result, client } = await mountHook()
    expect(result.current.selectedSavedCardId).toBe("pm_a")

    // The buyer switches to "use a new card" (clears the saved-card choice)...
    act(() => {
      result.current.setSelectedSavedCardId("")
    })
    serveSavedCards([savedCard({ stripeCardId: "pm_a", isDefault: true }), savedCard({ stripeCardId: "pm_b" })])
    await refetchSavedCards(client)

    // ...and a background refetch (with a changed list) must not pick a saved card for them again.
    await waitFor(() => expect(result.current.savedCards).toHaveLength(2))
    expect(result.current.selectedSavedCardId).toBe("")
  })

  it("does not pre-select a saved card while a new card is already pending", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_a", isDefault: true })])
    useCheckoutStore.setState({ pendingNewCard: pendingCard() })

    const { result } = await mountHook()

    expect(result.current.selectedSavedCardId).toBe("")
  })
})

describe("useBillingInformation — showInlineNewCardForm", () => {
  it("is false while cards are still loading", () => {
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useBillingInformation(), { wrapper })

    expect(result.current.showInlineNewCardForm).toBe(false)
  })

  it("is true once loaded with no saved cards", async () => {
    const { result } = await mountHook()

    expect(result.current.showInlineNewCardForm).toBe(true)
  })

  it("is true when every saved card has expired", async () => {
    serveSavedCards([savedCard({ expMonth: 1, expYear: 2000 })])

    const { result } = await mountHook()

    expect(result.current.showInlineNewCardForm).toBe(true)
  })

  it("is false when a usable saved card exists", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_a" })])

    const { result } = await mountHook()

    expect(result.current.showInlineNewCardForm).toBe(false)
  })

  it("is false once a new card has been tokenized", async () => {
    useCheckoutStore.setState({ pendingNewCard: pendingCard() })
    const { result } = await mountHook()

    expect(result.current.showInlineNewCardForm).toBe(false)
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
})

describe("useBillingInformation — new card (inline tokenize)", () => {
  it("stores the payment method id, a readable summary, and the pending card on success", async () => {
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).toHaveBeenCalledTimes(1)
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_new_card")
    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("VISA •••• 4242")
    expect(useCheckoutStore.getState().currentStep).toBe(2)
    expect(useCheckoutStore.getState().pendingNewCard).toEqual({
      paymentMethodId: "pm_new_card",
      brand: "visa",
      last4: "4242",
      expMonth: null,
      expYear: null,
    })
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
    expect(useCheckoutStore.getState().pendingNewCard).toBeNull()
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

  it("shows an error and clears the submitting state when Stripe can't be reached over the network", async () => {
    fakeStripe().createPaymentMethod.mockRejectedValue(new Error("Network request failed"))
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("We couldn't reach Stripe. Please check your connection and try again.")
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
    expect(result.current.isSubmitting).toBe(false)
  })

  it("does not show a second toast when the failed Stripe call was actually a handled session expiry", async () => {
    fakeStripe().createPaymentMethod.mockRejectedValue(Object.assign(new Error("Unauthorized"), { authHandled: true }))
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
    expect(result.current.isSubmitting).toBe(false)
  })

  it("marks the submission in-flight only while waiting on Stripe", async () => {
    let resolveCreate: (value: unknown) => void = () => {}
    fakeStripe().createPaymentMethod.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )
    const { result } = await mountHook()

    expect(result.current.isSubmitting).toBe(false)

    let submitPromise!: Promise<void>
    act(() => {
      submitPromise = result.current.onSubmit(submitEvent()) as unknown as Promise<void>
    })

    await waitFor(() => expect(result.current.isSubmitting).toBe(true))

    await act(async () => {
      resolveCreate(stripePaymentMethod("pm_new_card"))
      await submitPromise
    })

    expect(result.current.isSubmitting).toBe(false)
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_new_card")
  })

  it("requires a card name before saving, without ever calling Stripe", async () => {
    useCheckoutStore.setState({ saveCard: true, cardName: "   " })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Please enter a card name to save this card.")
    expect(fakeStripe().createPaymentMethod).not.toHaveBeenCalled()
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

describe("useBillingInformation — tokenizeNewCard", () => {
  it("tokenizes, stores the pending card, and resolves true on success", async () => {
    const { result } = await mountHook()

    let ok = false
    await act(async () => {
      ok = await result.current.tokenizeNewCard()
    })

    expect(ok).toBe(true)
    expect(useCheckoutStore.getState().pendingNewCard?.paymentMethodId).toBe("pm_new_card")
  })

  it("resolves false and leaves no pending card when the card is declined", async () => {
    fakeStripe().createPaymentMethod.mockResolvedValue(stripeError("Your card was declined."))
    const { result } = await mountHook()

    let ok = true
    await act(async () => {
      ok = await result.current.tokenizeNewCard()
    })

    expect(ok).toBe(false)
    expect(useCheckoutStore.getState().pendingNewCard).toBeNull()
  })
})

describe("useBillingInformation — pending new card", () => {
  it("continues with the pending card without calling Stripe again", async () => {
    useCheckoutStore.setState({ pendingNewCard: pendingCard({ paymentMethodId: "pm_pending", last4: "9999" }) })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_pending")
    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("VISA •••• 9999")
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("still requires a card name for a pending card when the cart repeats", async () => {
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ pendingNewCard: pendingCard(), cardName: "  " })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("Please enter a card name to save this card.")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })
})

describe("useBillingInformation — saved card", () => {
  it("uses the saved card id as the payment method and advances", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", brand: "mastercard", last4: "0007" })])
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved" })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(fakeStripe().createPaymentMethod).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().paymentMethodId).toBe("pm_saved")
    expect(useCheckoutStore.getState().paymentMethodSummary).toBe("MASTERCARD •••• 0007")
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("does not clear a leftover save-card intent — useFinalReview ignores it for a saved card anyway", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved" })])
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", saveCard: true })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(useCheckoutStore.getState().saveCard).toBe(true)
  })

  it("refuses an expired saved card and does not advance", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", expMonth: 1, expYear: 2000 })])
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved" })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith("This card has expired. Please choose another card.")
    expect(useCheckoutStore.getState().currentStep).toBe(1)
    expect(useCheckoutStore.getState().paymentMethodId).toBe("")
  })

  it("blocks a repeat order on a card with no off-session mandate until consent is ticked", async () => {
    serveSavedCards([savedCard({ stripeCardId: "pm_saved", openToAutoPayment: false })])
    useCartStore.setState({ items: [autoOrderCartItem()] })
    useCheckoutStore.setState({ selectedSavedCardId: "pm_saved", autoOrderConsent: false })
    const { result } = await mountHook()

    await submit(result.current.onSubmit)

    expect(errorToast).toHaveBeenCalledWith(
      "Automatic payments not allowed yet",
      "Allow this card to be charged automatically, or remove the auto order items from your cart.",
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
