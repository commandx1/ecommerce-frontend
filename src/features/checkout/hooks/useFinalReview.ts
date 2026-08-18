"use client"

import { useStripe } from "@stripe/react-stripe-js"
import { useCallback, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCheckoutAutoOrder } from "@/features/checkout/hooks/useCheckoutAutoOrder"
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
const POLL_INTERVAL_MS = 3000
const MAX_PAYMENT_STATUS_RETRIES = 3

function mapPaymentIntentStatusToOrderStatus(paymentIntentStatus: string): string {
  if (paymentIntentStatus === "canceled") {
    return "PAYMENT_FAILED"
  }

  if (paymentIntentStatus === "succeeded" || paymentIntentStatus === "requires_capture") {
    return "PAYMENT_SUCCESS"
  }

  if (paymentIntentStatus === "processing") {
    return "PAYMENT_PROCESSING"
  }

  return "PENDING_PAYMENT"
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
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
    autoOrderConsent,
    newCardAutoPaymentConsent,
    selectedSavedCardId,
    setAutoOrderUserProductIds,
  } = useCheckoutStore()
  const { cartId } = useCartStore()
  const { hasAutoOrderItems, autoOrderLines } = useCheckoutAutoOrder()
  const stripe = useStripe()

  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const submitDisabled = useMemo(() => {
    if (isPlacingOrder) return true
    if (paymentMethod.type === "card" && !stripe) return true
    if (paymentMethod.type === "card" && !paymentMethodId) return true
    return false
  }, [isPlacingOrder, paymentMethod.type, paymentMethodId, stripe])

  const pollPaymentStatus = useCallback(async (paymentIntentId: string): Promise<string | null> => {
    for (let attempt = 1; attempt <= MAX_PAYMENT_STATUS_RETRIES; attempt += 1) {
      try {
        const paymentStatusResponse = await ordersAPI.getPaymentStatus(paymentIntentId)
        const normalizedStatus = paymentStatusResponse.status.toLowerCase()

        if (normalizedStatus === "canceled" || normalizedStatus === "succeeded") {
          return normalizedStatus
        }
      } catch {
        // Continue retry loop for transient polling failures.
      }

      if (attempt < MAX_PAYMENT_STATUS_RETRIES) {
        await wait(POLL_INTERVAL_MS)
      }
    }

    return null
  }, [])

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

        const isNewCard = selectedSavedCardId === ""
        // Repeat items can only be charged later from a saved card, so the
        // backend refuses a new card that is not saved with an off-session mandate.
        const mustSaveCard = saveCard || (isNewCard && hasAutoOrderItems)

        if (mustSaveCard) {
          const trimmedCardName = cardName.trim()
          if (!trimmedCardName) {
            showToast.error("Please enter a card name to save this card.")
            return
          }
          payload.cardSave = true
          payload.cardName = trimmedCardName
          payload.cardOpenToAutoPayment = hasAutoOrderItems || newCardAutoPaymentConsent
          payload.cardAutoOrderCard = hasAutoOrderItems || newCardAutoPaymentConsent
        } else {
          payload.cardSave = false
          payload.cardName = ""
        }

        // Only consulted for a saved card that is not open to auto payments yet.
        if (!isNewCard && hasAutoOrderItems && autoOrderConsent) {
          payload.openToAutoOrder = true
        }
      }

      const response = await ordersAPI.placeOrder(payload)

      // Snapshot before the cart is cleared, so the confirmation screen can wait
      // for exactly these schedules to appear
      setAutoOrderUserProductIds(autoOrderLines.map((line) => line.userProductId))

      let finalOrderStatus = response.status
      let paymentStatus = response.status
      let isPaymentCanceled = false

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

        if (!cardResult.paymentIntent) {
          showToast.error("Payment could not be completed. Please use a different card and try again.")
          return
        }

        const initialPaymentIntentStatus = cardResult.paymentIntent.status
        const terminalPolledStatus = await pollPaymentStatus(cardResult.paymentIntent.id)
        const resolvedPaymentIntentStatus = terminalPolledStatus ?? initialPaymentIntentStatus
        paymentStatus = resolvedPaymentIntentStatus

        if (
          !SUCCESSFUL_PAYMENT_INTENT_STATUSES.has(resolvedPaymentIntentStatus) &&
          resolvedPaymentIntentStatus !== "canceled"
        ) {
          finalOrderStatus = "PENDING_PAYMENT"
        } else {
          finalOrderStatus = mapPaymentIntentStatusToOrderStatus(resolvedPaymentIntentStatus)
        }

        isPaymentCanceled = resolvedPaymentIntentStatus === "canceled"
      }

      if (isPaymentCanceled) {
        showToast.error(`Order placed but payment was canceled. Order ID: ${response.orderId}`)
      } else {
        showToast.success(`Order placed successfully. Order ID: ${response.orderId}`)
      }

      setOrderResult({ ...response, status: finalOrderStatus, paymentStatus })
      nextStep()
    } catch (error: unknown) {
      const maybeError = error as { response?: { data?: { message?: string } } }
      showToast.error(maybeError.response?.data?.message || "Failed to place order. Please try again.")
    } finally {
      setIsPlacingOrder(false)
    }
  }, [
    autoOrderConsent,
    autoOrderLines,
    cardName,
    cartId,
    hasAutoOrderItems,
    setAutoOrderUserProductIds,
    newCardAutoPaymentConsent,
    nextStep,
    orderPayload,
    paymentMethod.type,
    paymentMethodId,
    pollPaymentStatus,
    saveCard,
    selectedSavedCardId,
    setOrderResult,
    stripe,
  ])

  return {
    isPlacingOrder,
    paymentMethodSummary,
    submitDisabled,
    onPlaceOrder,
  }
}
