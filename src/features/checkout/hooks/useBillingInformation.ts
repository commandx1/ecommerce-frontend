"use client"

import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { PaymentMethodOption } from "@/features/checkout/types"
import { ordersAPI, type SavedCard } from "@/lib/api/orders"
import { useCheckoutStore } from "@/stores/checkoutStore"

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [{ type: "card", title: "Credit/Debit Card", icon: "card" }]

interface UseBillingInformationResult {
  cardName: string
  isLoadingCards: boolean
  paymentType: "card" | "net30" | "wire" | "financing"
  paymentOptions: PaymentMethodOption[]
  saveCard: boolean
  savedCards: SavedCard[]
  selectedSavedCardId: string
  setCardName: (name: string) => void
  setSaveCard: (save: boolean) => void
  setSelectedSavedCardId: (cardId: string) => void
  onSubmit: (event: React.FormEvent) => void
}

export function useBillingInformation(): UseBillingInformationResult {
  const stripe = useStripe()
  const elements = useElements()
  const {
    cardName,
    nextStep,
    paymentMethod,
    saveCard,
    selectedSavedCardId,
    setCardName,
    setPaymentMethodId,
    setPaymentMethodSummary,
    setSaveCard,
    setSelectedSavedCardId,
    termsAgreed,
  } = useCheckoutStore()
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)

  useEffect(() => {
    if (paymentMethod.type !== "card") return

    let isMounted = true
    setIsLoadingCards(true)

    ordersAPI
      .getSavedCards()
      .then((response) => {
        if (!isMounted) return
        setSavedCards(response.cards || [])
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
          setPaymentMethodId(selectedSavedCardId)
          setPaymentMethodSummary(
            selectedCard
              ? `${selectedCard.brand?.toUpperCase()} •••• ${selectedCard.last4}`
              : "Saved card",
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

        const createdPaymentMethod = await stripe.createPaymentMethod({
          type: "card",
          card: cardNumberElement,
        })

        if (createdPaymentMethod.error || !createdPaymentMethod.paymentMethod?.id) {
          showToast.error(createdPaymentMethod.error?.message || "Card details are invalid.")
          return
        }

        if (saveCard) {
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
      cardName,
      elements,
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
    paymentType: paymentMethod.type,
    paymentOptions,
    saveCard,
    savedCards,
    selectedSavedCardId,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
    onSubmit,
  }
}
