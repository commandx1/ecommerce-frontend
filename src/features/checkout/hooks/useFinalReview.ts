"use client"

import { useStripe } from "@stripe/react-stripe-js"
import { useCallback, useMemo, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCheckoutAutoOrder } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
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
/** Sentinel returned by `pollPaymentStatus` when the session died mid-poll, so the caller
 * cannot mistake an unconfirmed payment for a successful one. */
const PAYMENT_STATUS_AUTH_FAILURE = "auth-failure"

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
  // Re-entrancy guard: a ref, because a state update is asynchronous and would not close the
  // window between two synchronous calls (form onSubmit, Enter key, a caller that ignores
  // `submitDisabled`) — each of which would otherwise create a second order and a second charge.
  const isPlacingOrderRef = useRef(false)

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
      } catch (error: unknown) {
        if (isAuthHandledError(error) || isAuthErrorStatus(extractErrorStatus(error))) {
          // The session expired: the axios interceptor already logs the buyer out, so stop
          // immediately instead of burning the remaining attempts and falling back to Stripe's
          // optimistic status.
          return PAYMENT_STATUS_AUTH_FAILURE
        }

        // Transient failure (5xx, network): keep retrying, but do not swallow it silently.
        console.warn("Payment status polling attempt failed", error)
      }

      if (attempt < MAX_PAYMENT_STATUS_RETRIES) {
        await wait(POLL_INTERVAL_MS)
      }
    }

    return null
  }, [])

  const onPlaceOrder = useCallback(async () => {
    if (isPlacingOrderRef.current) {
      return
    }
    isPlacingOrderRef.current = true

    try {
      if (!orderPayload) {
        showToast.error("Order information is missing. Please go back and review your shipping details.")
        return
      }

      // Everything that decides whether the charge can happen at all is checked BEFORE the order
      // is created, so a missing SDK or card can never leave an unpaid order behind.
      if (paymentMethod.type === "card") {
        if (!paymentMethodId) {
          showToast.error("Payment details are missing. Please go back to Billing and re-enter your card.")
          return
        }

        if (!stripe) {
          showToast.error("Stripe is not ready. Please refresh and try again.")
          return
        }
      }

      setIsPlacingOrder(true)
      const payload = {
        ...orderPayload,
        cartId: cartId || "",
      }

      if (paymentMethod.type === "card") {
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

      // Cleared up front so a failed attempt cannot leave the previous checkout's
      // expectations behind for the confirmation screen to poll for.
      setAutoOrderUserProductIds([])

      let finalOrderStatus = response.status
      let paymentStatus = response.status
      let isPaymentCanceled = false

      if (paymentMethod.type === "card") {
        if (!response.clientSecret) {
          // Backend contract violation: the order row exists but no payment can be started.
          // Say so plainly instead of a vague toast, and record the unpaid order.
          showToast.error(
            `Payment could not be initiated. Order ${response.orderId} was created but not paid — please contact support before trying again.`,
          )
          setOrderResult({ ...response, status: "PENDING_PAYMENT", paymentStatus: "PENDING_PAYMENT" })
          return
        }

        // Both were verified before the order was created; kept as type guards.
        if (!paymentMethodId || !stripe) {
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

        if (terminalPolledStatus === PAYMENT_STATUS_AUTH_FAILURE) {
          showToast.error(
            `Your session expired before the payment could be confirmed. Order ${response.orderId} is not confirmed — please sign in again and check it before paying twice.`,
          )
          setOrderResult({ ...response, status: "PENDING_PAYMENT", paymentStatus: "unknown" })
          return
        }

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

      // Auto-order schedules are only written once Stripe's `payment_intent.succeeded` webhook
      // lands, so snapshot the expected ids only when the payment actually went through. Doing it
      // right after `placeOrder` left the confirmation screen polling ~90s for schedules that a
      // canceled or unconfirmed payment never creates.
      if (!isPaymentCanceled && finalOrderStatus !== "PENDING_PAYMENT") {
        setAutoOrderUserProductIds(autoOrderLines.map((line) => line.userProductId))
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
      isPlacingOrderRef.current = false
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
