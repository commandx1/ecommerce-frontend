"use client"

import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { ordersAPI, type SavedCard } from "@/lib/api/orders"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UseFinalReviewResult {
  cardName: string
  isLoadingCards: boolean
  isPlacingOrder: boolean
  isStripeReady: boolean
  paymentType: "card" | "net30" | "wire" | "financing"
  saveCard: boolean
  savedCards: SavedCard[]
  selectedSavedCardId: string
  submitDisabled: boolean
  onPlaceOrder: () => Promise<void>
  setCardName: (name: string) => void
  setSaveCard: (save: boolean) => void
  setSelectedSavedCardId: (cardId: string) => void
}

const SUCCESSFUL_PAYMENT_INTENT_STATUSES = new Set(["succeeded", "processing", "requires_capture"])

function mapPaymentIntentStatusToOrderStatus(paymentIntentStatus: string): string {
  if (paymentIntentStatus === "succeeded" || paymentIntentStatus === "requires_capture") {
    return "PAYMENT_SUCCESS"
  }

  if (paymentIntentStatus === "processing") {
    return "PAYMENT_PROCESSING"
  }

  return "PENDING_PAYMENT"
}

export function useFinalReview(): UseFinalReviewResult {
  const {
    shippingAddress,
    paymentMethod,
    nextStep,
    orderPayload,
    setOrderResult,
    saveCard,
    setSaveCard,
    cardName,
    setCardName,
  } = useCheckoutStore()

  const stripe = useStripe()
  const elements = useElements()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [selectedSavedCardId, setSelectedSavedCardId] = useState("")

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

  const isStripeReady = useMemo(() => Boolean(stripe && elements), [elements, stripe])

  // CardElement mount / doldurulma durumu React state’e yansımaz; getElement ile useMemo’da
  // kontrol etmek butonu kalıcı disabled bırakır. Stripe doğrulaması zaten onPlaceOrder içinde.
  const submitDisabled = useMemo(() => {
    if (isPlacingOrder) return true
    if (paymentMethod.type !== "card") return false
    if (!isStripeReady) return true
    if (isLoadingCards) return true
    return false
  }, [isLoadingCards, isPlacingOrder, isStripeReady, paymentMethod.type])

  const onPlaceOrder = useCallback(async () => {
    if (!orderPayload) {
      showToast.error("Order information is missing. Please go back and review your shipping details.")
      return
    }

    try {
      setIsPlacingOrder(true)
      const payload = {
        ...orderPayload,
        ...(paymentMethod.type === "card" && saveCard ? { cardSave: 1, cardName: cardName.trim() || "Card" } : {}),
      }

      const response = await ordersAPI.placeOrder(payload)

      let finalOrderStatus = response.status

      if (paymentMethod.type === "card") {
        if (!stripe || !elements) {
          showToast.error("Stripe is not ready. Please refresh and try again.")
          return
        }

        if (!response.clientSecret) {
          showToast.error("Payment could not be initiated. Missing client secret.")
          return
        }

        if (selectedSavedCardId) {
          const savedCardResult = await stripe.confirmCardPayment(response.clientSecret, {
            payment_method: selectedSavedCardId,
          })

          if (savedCardResult.error) {
            showToast.error(savedCardResult.error.message || "Payment failed. Please try again.")
            return
          }

          if (!savedCardResult.paymentIntent) {
            showToast.error("Payment could not be completed. Please try again.")
            return
          }

          if (!SUCCESSFUL_PAYMENT_INTENT_STATUSES.has(savedCardResult.paymentIntent.status)) {
            showToast.error("Payment could not be completed. Please use a different card and try again.")
            return
          }

          finalOrderStatus = mapPaymentIntentStatusToOrderStatus(savedCardResult.paymentIntent.status)
        } else {
          const cardElement = elements.getElement(CardElement)
          if (!cardElement) {
            showToast.error("Please enter your card details.")
            return
          }

          const cardResult = await stripe.confirmCardPayment(response.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() || undefined,
              },
            },
          })

          if (cardResult.error) {
            showToast.error(cardResult.error.message || "Payment failed. Please try again.")
            return
          }

          if (!cardResult.paymentIntent) {
            showToast.error("Payment could not be completed. Please try again.")
            return
          }

          if (!SUCCESSFUL_PAYMENT_INTENT_STATUSES.has(cardResult.paymentIntent.status)) {
            showToast.error("Payment could not be completed. Please use a different card and try again.")
            return
          }

          finalOrderStatus = mapPaymentIntentStatusToOrderStatus(cardResult.paymentIntent.status)
        }
      }

      showToast.success(`Order placed successfully. Order ID: ${response.orderId}`)
      setOrderResult({ ...response, status: finalOrderStatus })
      nextStep()
    } catch (error: unknown) {
      const maybeError = error as { response?: { data?: { message?: string } } }
      showToast.error(maybeError.response?.data?.message || "Failed to place order. Please try again.")
    } finally {
      setIsPlacingOrder(false)
    }
  }, [
    cardName,
    elements,
    nextStep,
    orderPayload,
    paymentMethod.type,
    saveCard,
    selectedSavedCardId,
    setOrderResult,
    shippingAddress.firstName,
    shippingAddress.lastName,
    stripe,
  ])

  return {
    cardName,
    isLoadingCards,
    isPlacingOrder,
    isStripeReady,
    paymentType: paymentMethod.type,
    saveCard,
    savedCards,
    selectedSavedCardId,
    submitDisabled,
    onPlaceOrder,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
  }
}
