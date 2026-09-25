"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { cartCommands } from "@/features/cart/api/cart-queries"
import { extractApiErrorMessage } from "@/lib/api/api-error-message"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import type { BuyerOrder, BuyerOrderItem, RefundOrderPayload } from "@/lib/api/buyer-orders"
import type { BuyerOrderListParams } from "@/lib/query/keys"
import { ordersCommands } from "../api/orders-queries"
import type { PendingCancelAction } from "../types"

export interface UseBuyerOrderActionsResult {
  reorderingItemId: string | null
  handleReorder: (userProductId: string, quantity: number, productName: string) => Promise<void>
  cancelingItemId: string | null
  cancelingSellerKey: string | null
  pendingCancelAction: PendingCancelAction | null
  isConfirmingCancel: boolean
  requestCancelAction: (action: PendingCancelAction) => void
  setPendingCancelAction: (action: PendingCancelAction | null) => void
  confirmPendingCancelAction: () => Promise<void>
  pendingRefundOrder: BuyerOrder | null
  isSubmittingRefund: boolean
  requestRefundAction: (order: BuyerOrder, orderItem: BuyerOrderItem) => void
  setPendingRefundOrder: (order: BuyerOrder | null) => void
  submitRefundOrder: (payload: RefundOrderPayload) => Promise<void>
}

/**
 * Reorder / cancel-during-delivery / refund actions. Cache patches live in `ordersCommands`; this
 * hook owns the pending UI state and the auth-redirect/toast branching. `params` are the CURRENT
 * list query's params, so a write patches the exact entry the table reads (no extra GET).
 */
export function useBuyerOrderActions(params: BuyerOrderListParams): UseBuyerOrderActionsResult {
  const router = useRouter()

  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null)
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null)
  const [cancelingSellerKey, setCancelingSellerKey] = useState<string | null>(null)
  const [pendingCancelAction, setPendingCancelAction] = useState<PendingCancelAction | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [pendingRefundOrder, setPendingRefundOrder] = useState<BuyerOrder | null>(null)
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false)

  const handleReorder = useCallback(
    async (userProductId: string, quantity: number, productName: string) => {
      setReorderingItemId(userProductId)

      try {
        await cartCommands.addItem(userProductId, quantity)
        showToast.success("Added to cart", `${productName} was added to your cart.`)
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          return
        }

        const status = extractErrorStatus(error)
        if (isAuthErrorStatus(status)) {
          showToast.error("Authentication required", "Please sign in to reorder items.")
          router.push("/login")
          return
        }

        showToast.error("Reorder failed", "This item could not be added to your cart. Please try again.")
      } finally {
        setReorderingItemId(null)
      }
    },
    [router],
  )

  const handleCancelDuringDelivery = useCallback(
    async (
      orderItemIds: string[],
      successFallbackMessage: string,
      options?: { cancelingItemId?: string; cancelingSellerKey?: string },
    ) => {
      if (orderItemIds.length === 0) return
      if (options?.cancelingItemId) {
        setCancelingItemId(options.cancelingItemId)
      }
      if (options?.cancelingSellerKey) {
        setCancelingSellerKey(options.cancelingSellerKey)
      }

      try {
        const response = await ordersCommands.cancelDuringDeliveryByCustomer(params, { orderItemIds })
        showToast.success("Cancellation sent", response.message || successFallbackMessage)
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          return
        }

        const status = extractErrorStatus(error)
        const apiErrorMessage = extractApiErrorMessage(error)
        if (isAuthErrorStatus(status)) {
          showToast.error("Authentication required", apiErrorMessage || "Please sign in to cancel this order item.")
          router.push("/login")
          return
        }

        showToast.error(
          "Cancellation failed",
          apiErrorMessage || "Your cancellation request could not be submitted. Please try again.",
        )
      } finally {
        if (options?.cancelingItemId) {
          setCancelingItemId(null)
        }
        if (options?.cancelingSellerKey) {
          setCancelingSellerKey(null)
        }
      }
    },
    [params, router],
  )

  const requestCancelAction = useCallback((action: PendingCancelAction) => {
    setPendingCancelAction(action)
  }, [])

  const confirmPendingCancelAction = useCallback(async () => {
    if (!pendingCancelAction) return

    setIsConfirmingCancel(true)
    try {
      await handleCancelDuringDelivery(
        pendingCancelAction.orderItemIds,
        pendingCancelAction.description,
        pendingCancelAction.options,
      )
    } finally {
      setIsConfirmingCancel(false)
      setPendingCancelAction(null)
    }
  }, [handleCancelDuringDelivery, pendingCancelAction])

  const requestRefundAction = useCallback((order: BuyerOrder, orderItem: BuyerOrderItem) => {
    if (typeof orderItem.returnDate === "string" && orderItem.returnDate.trim().length > 0) {
      return
    }

    setPendingRefundOrder({
      ...order,
      orderItems: [orderItem],
      sellerGroups: Array.isArray(order.sellerGroups)
        ? order.sellerGroups
            .map((group) => ({
              ...group,
              orderItems: group.orderItems.filter((item) => item.id === orderItem.id),
            }))
            .filter((group) => group.orderItems.length > 0)
        : order.sellerGroups,
    })
  }, [])

  const submitRefundOrder = useCallback(
    async (payload: RefundOrderPayload) => {
      if (!pendingRefundOrder || payload.items.length === 0) return

      setIsSubmittingRefund(true)
      try {
        const response = await ordersCommands.refundOrder(params, payload, pendingRefundOrder.orderId)
        showToast.success("Return request sent", response.message || "Your return request was submitted successfully.")
        setPendingRefundOrder(null)
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          return
        }

        const status = extractErrorStatus(error)
        const apiErrorMessage = extractApiErrorMessage(error)
        if (isAuthErrorStatus(status)) {
          showToast.error("Authentication required", apiErrorMessage || "Please sign in to request a refund.")
          router.push("/login")
          return
        }

        showToast.error("Return request failed", apiErrorMessage || "Your return request could not be submitted.")
      } finally {
        setIsSubmittingRefund(false)
      }
    },
    [params, pendingRefundOrder, router],
  )

  return {
    reorderingItemId,
    handleReorder,
    cancelingItemId,
    cancelingSellerKey,
    pendingCancelAction,
    isConfirmingCancel,
    requestCancelAction,
    setPendingCancelAction,
    confirmPendingCancelAction,
    pendingRefundOrder,
    isSubmittingRefund,
    requestRefundAction,
    setPendingRefundOrder,
    submitRefundOrder,
  }
}
