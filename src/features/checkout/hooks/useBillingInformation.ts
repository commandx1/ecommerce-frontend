"use client"

import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCallback, useEffect, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCheckoutAutoOrder } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import { useCheckoutSavedCardsQuery } from "@/features/checkout/hooks/useCheckoutSavedCardsQuery"
import { isCardExpired, pickInitialCardId } from "@/features/checkout/lib/saved-card-utils"
import type { SavedCard } from "@/lib/api/orders"
import { type PendingNewCard, useCheckoutStore } from "@/stores/checkoutStore"

const NO_SAVED_CARDS: SavedCard[] = []

interface UseBillingInformationResult {
  cardName: string
  isLoadingCards: boolean
  isSubmitting: boolean
  saveCard: boolean
  savedCards: SavedCard[]
  selectedSavedCardId: string
  pendingNewCard: PendingNewCard | null
  showInlineNewCardForm: boolean
  hasAutoOrderItems: boolean
  autoOrderConsent: boolean
  newCardAutoPaymentConsent: boolean
  setCardName: (name: string) => void
  setSaveCard: (save: boolean) => void
  setSelectedSavedCardId: (cardId: string) => void
  setAutoOrderConsent: (consent: boolean) => void
  setNewCardAutoPaymentConsent: (consent: boolean) => void
  setPendingNewCard: (card: PendingNewCard | null) => void
  tokenizeNewCard: () => Promise<boolean>
  onSubmit: (event: React.FormEvent) => void
}

export function useBillingInformation(): UseBillingInformationResult {
  const stripe = useStripe()
  const elements = useElements()
  const {
    autoOrderConsent,
    cardName,
    newCardAutoPaymentConsent,
    nextStep,
    pendingNewCard,
    saveCard,
    selectedSavedCardId,
    setAutoOrderConsent,
    setCardName,
    setNewCardAutoPaymentConsent,
    setPaymentMethodId,
    setPaymentMethodSummary,
    setPendingNewCard,
    setSaveCard,
    setSelectedSavedCardId,
    termsAgreed,
  } = useCheckoutStore()
  const { hasAutoOrderItems } = useCheckoutAutoOrder()
  const savedCardsQuery = useCheckoutSavedCardsQuery()
  const savedCards = savedCardsQuery.data ?? NO_SAVED_CARDS
  // `isPending`, so it starts true: a false first render would flash the inline new-card form
  // (mounting Stripe's iframes) for buyers who do have saved cards.
  const isLoadingCards = savedCardsQuery.isPending
  const [isSubmitting, setIsSubmitting] = useState(false)
  // The initial pre-selection / error toast runs once per mount, off the first settled fetch -
  // never again on a later background refetch.
  const hasSettledInitialCardsRef = useRef(false)

  useEffect(() => {
    if (hasSettledInitialCardsRef.current) {
      return
    }

    if (savedCardsQuery.isSuccess) {
      hasSettledInitialCardsRef.current = true
      // Only pre-select on first load: a returning buyer's own choice (from stepping back from
      // step 4) or an already-tokenized pending card must never be overwritten by this effect.
      const state = useCheckoutStore.getState()
      if (state.selectedSavedCardId === "" && state.pendingNewCard === null) {
        setSelectedSavedCardId(pickInitialCardId(savedCardsQuery.data))
      }
      return
    }

    if (savedCardsQuery.isError) {
      hasSettledInitialCardsRef.current = true
      showToast.error("Failed to load saved cards.")
    }
  }, [savedCardsQuery.isSuccess, savedCardsQuery.isError, savedCardsQuery.data, setSelectedSavedCardId])

  // True when there is no card the buyer could just pick: no saved cards, or all of them expired,
  // and no pending new card already tokenized. The inline form then has to stay on screen instead
  // of hiding behind a "use a saved card" default.
  const showInlineNewCardForm =
    !isLoadingCards && !pendingNewCard && savedCards.every((card) => card == null || isCardExpired(card))

  const tokenizeNewCard = useCallback(async (): Promise<boolean> => {
    if (!stripe || !elements) {
      showToast.error("Stripe is not ready. Please refresh and try again.")
      return false
    }

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      showToast.error("Please enter your card details.")
      return false
    }

    // Repeat items can only be charged later from a saved card, so saving is
    // not optional in that case.
    if (hasAutoOrderItems && !saveCard) {
      setSaveCard(true)
    }

    // Checked before the Stripe call so a missing name doesn't waste a tokenize round-trip.
    if ((saveCard || hasAutoOrderItems) && !cardName.trim()) {
      showToast.error("Please enter a card name to save this card.")
      return false
    }

    let createdPaymentMethod: Awaited<ReturnType<typeof stripe.createPaymentMethod>>
    setIsSubmitting(true)
    try {
      createdPaymentMethod = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
      })
    } catch (error: unknown) {
      // A rejected promise here means the request to Stripe itself never completed (e.g. no
      // network), not a declined/invalid card - Stripe resolves for those instead of
      // throwing. Session expiry is handled centrally by the axios interceptor, which marks
      // the error `authHandled` after logging out and redirecting; a second toast on top of
      // that redirect would be redundant.
      if (!(error as { authHandled?: boolean } | null)?.authHandled) {
        showToast.error("We couldn't reach Stripe. Please check your connection and try again.")
      }
      return false
    } finally {
      setIsSubmitting(false)
    }

    if (createdPaymentMethod.error || !createdPaymentMethod.paymentMethod?.id) {
      showToast.error(createdPaymentMethod.error?.message || "Card details are invalid.")
      return false
    }

    const card = createdPaymentMethod.paymentMethod.card
    setPendingNewCard({
      paymentMethodId: createdPaymentMethod.paymentMethod.id,
      brand: card?.brand ?? "",
      last4: card?.last4 ?? "",
      expMonth: card?.exp_month ?? null,
      expYear: card?.exp_year ?? null,
    })
    setSelectedSavedCardId("")
    setAutoOrderConsent(false)
    return true
  }, [
    cardName,
    elements,
    hasAutoOrderItems,
    saveCard,
    setAutoOrderConsent,
    setPendingNewCard,
    setSaveCard,
    setSelectedSavedCardId,
    stripe,
  ])

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!termsAgreed) return

      if (!stripe || !elements) {
        showToast.error("Stripe is not ready. Please refresh and try again.")
        return
      }

      if (selectedSavedCardId) {
        const selectedCard = savedCards.find((card) => card.stripeCardId === selectedSavedCardId)

        if (isCardExpired(selectedCard)) {
          showToast.error("This card has expired. Please choose another card.")
          return
        }

        // The backend rejects auto order items paid with a card that has no
        // off-session mandate unless the buyer explicitly opts in here.
        if (hasAutoOrderItems && !selectedCard?.openToAutoPayment && !autoOrderConsent) {
          showToast.error(
            "Automatic payments not allowed yet",
            "Allow this card to be charged automatically, or remove the auto order items from your cart.",
          )
          return
        }

        setPaymentMethodId(selectedSavedCardId)
        setPaymentMethodSummary(
          selectedCard ? `${selectedCard.brand?.toUpperCase()} •••• ${selectedCard.last4}` : "Saved card",
        )
        nextStep()
        return
      }

      if (pendingNewCard) {
        if (hasAutoOrderItems && !cardName.trim()) {
          showToast.error("Please enter a card name to save this card.")
          return
        }

        const { brand, last4 } = pendingNewCard
        setPaymentMethodId(pendingNewCard.paymentMethodId)
        setPaymentMethodSummary(brand ? `${brand.toUpperCase()} •••• ${last4}` : "New card")
        nextStep()
        return
      }

      const tokenized = await tokenizeNewCard()
      if (!tokenized) return

      const newPendingCard = useCheckoutStore.getState().pendingNewCard
      if (!newPendingCard) return

      setPaymentMethodId(newPendingCard.paymentMethodId)
      setPaymentMethodSummary(
        newPendingCard.brand ? `${newPendingCard.brand.toUpperCase()} •••• ${newPendingCard.last4}` : "New card",
      )
      nextStep()
    },
    [
      autoOrderConsent,
      cardName,
      elements,
      hasAutoOrderItems,
      nextStep,
      pendingNewCard,
      savedCards,
      selectedSavedCardId,
      setPaymentMethodId,
      setPaymentMethodSummary,
      stripe,
      termsAgreed,
      tokenizeNewCard,
    ],
  )

  return {
    cardName,
    isLoadingCards,
    isSubmitting,
    saveCard,
    savedCards,
    selectedSavedCardId,
    pendingNewCard,
    showInlineNewCardForm,
    hasAutoOrderItems,
    autoOrderConsent,
    newCardAutoPaymentConsent,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
    setAutoOrderConsent,
    setNewCardAutoPaymentConsent,
    setPendingNewCard,
    tokenizeNewCard,
    onSubmit,
  }
}
