"use client"

import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCheckoutAutoOrder } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import type { PaymentMethodOption } from "@/features/checkout/types"
import { ordersAPI, type SavedCard } from "@/lib/api/orders"
import { useCheckoutStore } from "@/stores/checkoutStore"

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [{ type: "card", title: "Credit/Debit Card", icon: "card" }]

interface UseBillingInformationResult {
  cardName: string
  isLoadingCards: boolean
  isSubmitting: boolean
  paymentType: "card" | "net30" | "wire" | "financing"
  paymentOptions: PaymentMethodOption[]
  saveCard: boolean
  savedCards: SavedCard[]
  selectedSavedCardId: string
  hasAutoOrderItems: boolean
  autoOrderConsent: boolean
  newCardAutoPaymentConsent: boolean
  setCardName: (name: string) => void
  setSaveCard: (save: boolean) => void
  setSelectedSavedCardId: (cardId: string) => void
  setAutoOrderConsent: (consent: boolean) => void
  setNewCardAutoPaymentConsent: (consent: boolean) => void
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
    paymentMethod,
    saveCard,
    selectedSavedCardId,
    setAutoOrderConsent,
    setCardName,
    setNewCardAutoPaymentConsent,
    setPaymentMethodId,
    setPaymentMethodSummary,
    setSaveCard,
    setSelectedSavedCardId,
    termsAgreed,
  } = useCheckoutStore()
  const { hasAutoOrderItems } = useCheckoutAutoOrder()
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (paymentMethod.type !== "card") return

    let isMounted = true
    setIsLoadingCards(true)

    ordersAPI
      .getSavedCards()
      .then((response) => {
        if (!isMounted) return
        // Array.isArray, not `|| []`: a malformed 200 with a non-array `cards` would reach
        // .map() in the saved-card picker and blank the payment step (infra note #26).
        setSavedCards(Array.isArray(response.cards) ? response.cards : [])
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        const maybeError = error as { response?: { data?: { message?: string } } }
        const message = maybeError.response?.data?.message
        if (message?.includes("No active cards")) {
          setSavedCards([])
          return
        }
        showToast.error("Failed to load saved cards.")
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCards(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [paymentMethod.type])

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!termsAgreed) return

      if (paymentMethod.type === "card") {
        if (!stripe || !elements) {
          showToast.error("Stripe is not ready. Please refresh and try again.")
          return
        }

        if (selectedSavedCardId) {
          const selectedCard = savedCards.find((card) => card.stripeCardId === selectedSavedCardId)

          // The backend rejects auto order items paid with a card that has no
          // off-session mandate unless the buyer explicitly opts in here.
          if (hasAutoOrderItems && !selectedCard?.openToAutoPayment && !autoOrderConsent) {
            showToast.error(
              "Automatic payments not allowed yet",
              "Allow this card to be charged automatically, or remove the repeat items from your cart.",
            )
            return
          }

          setPaymentMethodId(selectedSavedCardId)
          setPaymentMethodSummary(
            selectedCard ? `${selectedCard.brand?.toUpperCase()} •••• ${selectedCard.last4}` : "Saved card",
          )
          setSaveCard(false)
          nextStep()
          return
        }

        const cardNumberElement = elements.getElement(CardNumberElement)
        if (!cardNumberElement) {
          showToast.error("Please enter your card details.")
          return
        }

        // Repeat items can only be charged later from a saved card, so saving is
        // not optional in that case.
        if (hasAutoOrderItems && !saveCard) {
          setSaveCard(true)
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
          return
        } finally {
          setIsSubmitting(false)
        }

        if (createdPaymentMethod.error || !createdPaymentMethod.paymentMethod?.id) {
          showToast.error(createdPaymentMethod.error?.message || "Card details are invalid.")
          return
        }

        if (saveCard || hasAutoOrderItems) {
          const trimmedCardName = cardName.trim()
          if (!trimmedCardName) {
            showToast.error("Please enter a card name to save this card.")
            return
          }
        }

        const card = createdPaymentMethod.paymentMethod.card
        const cardSummary = card ? `${card.brand?.toUpperCase()} •••• ${card.last4}` : "New card"
        setPaymentMethodId(createdPaymentMethod.paymentMethod.id)
        setPaymentMethodSummary(cardSummary)
      }

      nextStep()
    },
    [
      autoOrderConsent,
      cardName,
      elements,
      hasAutoOrderItems,
      nextStep,
      paymentMethod.type,
      saveCard,
      savedCards,
      selectedSavedCardId,
      setPaymentMethodId,
      setPaymentMethodSummary,
      setSaveCard,
      stripe,
      termsAgreed,
    ],
  )

  const paymentOptions = useMemo(() => PAYMENT_METHOD_OPTIONS, [])

  return {
    cardName,
    isLoadingCards,
    isSubmitting,
    paymentType: paymentMethod.type,
    paymentOptions,
    saveCard,
    savedCards,
    selectedSavedCardId,
    hasAutoOrderItems,
    autoOrderConsent,
    newCardAutoPaymentConsent,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
    setAutoOrderConsent,
    setNewCardAutoPaymentConsent,
    onSubmit,
  }
}
