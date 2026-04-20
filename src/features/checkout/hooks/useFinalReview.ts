"use client"

import { useStripe } from "@stripe/react-stripe-js"
import { useCallback, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { ordersAPI } from "@/lib/api/orders"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UseFinalReviewResult {
  isPlacingOrder: boolean
  paymentMethodSummary: string
  submitDisabled: boolean
  onPlaceOrder: () => Promise<void>
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
    paymentMethod,
    paymentMethodId,
    paymentMethodSummary,
    nextStep,
    orderPayload,
    setOrderResult,
    saveCard,
    cardName,
  } = useCheckoutStore()
  const { cartId } = useCartStore()
  const stripe = useStripe()

  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const submitDisabled = useMemo(() => {
    if (isPlacingOrder) return true
    if (paymentMethod.type === "card" && !stripe) return true
    if (paymentMethod.type === "card" && !paymentMethodId) return true
    return false
  }, [isPlacingOrder, paymentMethod.type, paymentMethodId, stripe])

  const onPlaceOrder = useCallback(async () => {
    if (!orderPayload) {
      showToast.error("Order information is missing. Please go back and review your shipping details.")
      return
    }

    try {
      setIsPlacingOrder(true)
      const payload = {
        ...orderPayload,
        cartId: cartId || "",
      }

      if (paymentMethod.type === "card") {
        if (!paymentMethodId) {
          showToast.error("Payment details are missing. Please go back to Billing and re-enter your card.")
          return
        }

        payload.paymentMethodId = paymentMethodId
        if (saveCard) {
          const trimmedCardName = cardName.trim()
          if (!trimmedCardName) {
            showToast.error("Please enter a card name to save this card.")
            return
          }
          payload.cardSave = 1
          payload.cardName = trimmedCardName
        } else {
          payload.cardSave = 0
          payload.cardName = ""
        }
      }

      const response = await ordersAPI.placeOrder(payload)

      let finalOrderStatus = response.status

      if (paymentMethod.type === "card") {
        if (!response.clientSecret) {
          showToast.error("Payment could not be initiated. Missing client secret.")
          return
        }

        if (!paymentMethodId) {
          showToast.error("Payment method is missing. Please go back to Billing.")
          return
        }

        if (!stripe) {
          showToast.error("Stripe is not ready. Please refresh and try again.")
          return
        }

        const cardResult = await stripe.confirmCardPayment(response.clientSecret, {
          payment_method: paymentMethodId,
        })
        if (cardResult.error) {
          showToast.error(cardResult.error.message || "Payment failed. Please try again.")
          return
        }

        if (!cardResult.paymentIntent || !SUCCESSFUL_PAYMENT_INTENT_STATUSES.has(cardResult.paymentIntent.status)) {
          showToast.error("Payment could not be completed. Please use a different card and try again.")
          return
        }

        finalOrderStatus = mapPaymentIntentStatusToOrderStatus(cardResult.paymentIntent.status)
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
  }, [cardName, nextStep, orderPayload, paymentMethodId, paymentMethod.type, saveCard, cartId, setOrderResult, stripe])

  return {
    isPlacingOrder,
    paymentMethodSummary,
    submitDisabled,
    onPlaceOrder,
  }
}
