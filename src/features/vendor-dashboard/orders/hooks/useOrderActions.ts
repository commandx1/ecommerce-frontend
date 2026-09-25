"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { extractApiErrorMessage } from "@/lib/api/api-error-message"
import {
  type ProcessUberDeliveriesResponse,
  type VendorOrder,
  type VendorOrderItem,
  type VendorOrdersResponse,
  vendorOrdersAPI,
} from "@/lib/api/vendor-orders"
import { queryKeys, type VendorOrderListParams } from "@/lib/query/keys"
import { patchCancelledItems, patchConfirmedReturns, patchRejectedReturns } from "../lib/order-patches"

interface CancelOptions {
  cancelingItemId?: string
  cancelingOrderId?: string
}

export interface OrderActions {
  processingOrderId: string | null
  cancelingItemId: string | null
  cancelingOrderId: string | null
  returnActionItemId: string | null
  returnActionType: "confirm" | "reject" | null
  uberResult: ProcessUberDeliveriesResponse | null
  setUberResult: (result: ProcessUberDeliveriesResponse | null) => void
  uberProcessedOrderIds: string[]
  handleCallUber: (order: VendorOrder) => Promise<void>
  handleCancelDuringDelivery: (orderItemIds: string[], description: string, options?: CancelOptions) => Promise<void>
  handleConfirmReturn: (item: VendorOrderItem) => Promise<void>
  handleRejectReturn: (orderItemId: string, reason: string) => Promise<boolean>
}

/**
 * Cache patches match today's page-local `setOrders` updates exactly (design §3.3): each action
 * patches the active orders list via `lib/order-patches` and invalidates every other mounted
 * orders view without forcing it to refetch immediately (`refetchType: "none"`) - the same
 * "patches without a refetch" contract the request-count tests in `VendorOrdersPage.test.tsx`
 * characterize. Per-item/per-order "in flight" state stays local (mirrors the old page's own
 * state, not `mutation.isPending`) because several rows can independently trigger the *same*
 * cancel mutation and each needs its own disabled state.
 */
export function useOrderActions(listParams: VendorOrderListParams): OrderActions {
  const queryClient = useQueryClient()
  const listKey = queryKeys.vendor.orders.list(listParams)

  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null)
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null)
  const [returnActionItemId, setReturnActionItemId] = useState<string | null>(null)
  const [returnActionType, setReturnActionType] = useState<"confirm" | "reject" | null>(null)
  const [uberResult, setUberResult] = useState<ProcessUberDeliveriesResponse | null>(null)
  const [uberProcessedOrderIds, setUberProcessedOrderIds] = useState<string[]>([])

  const invalidateOtherOrderViews = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.vendor.orders.all, refetchType: "none" })

  const patchList = (updater: (page: VendorOrdersResponse) => VendorOrdersResponse) => {
    queryClient.setQueryData<VendorOrdersResponse>(listKey, (data) => (data ? updater(data) : data))
  }

  const callUberMutation = useMutation({
    mutationFn: (orderItemIds: string[]) => vendorOrdersAPI.processUberDeliveries({ orderItemIds }),
  })

  const cancelMutation = useMutation({
    mutationFn: (orderItemIds: string[]) => vendorOrdersAPI.cancelBySeller({ orderItemIds }),
  })

  const confirmReturnMutation = useMutation({
    mutationFn: (orderItemId: string) => vendorOrdersAPI.sellerConfirmReturn({ orderItemIds: [orderItemId] }),
  })

  const rejectReturnMutation = useMutation({
    mutationFn: ({ orderItemId, reason }: { orderItemId: string; reason: string }) =>
      vendorOrdersAPI.sellerRejectReturn({ items: [{ orderItemId, returnRejectReason: reason }] }),
  })

  const handleCallUber = async (order: VendorOrder) => {
    const orderItemIds = order.orderItems
      .filter((item) => item.status === "WAITING_FOR_UBER_DIRECT" || item.status === "UBER_ERROR")
      .map((item) => item.id)

    if (orderItemIds.length === 0) {
      showToast.info("No eligible items", "This order has no Uber-waiting or Uber-error items.")
      return
    }

    try {
      setProcessingOrderId(order.orderId)
      const response = await callUberMutation.mutateAsync(orderItemIds)
      setUberResult(response)
      setUberProcessedOrderIds((prev) => (prev.includes(order.orderId) ? prev : [...prev, order.orderId]))
      showToast.success("Uber request sent", response.message || "Uber delivery has been created.")
      invalidateOtherOrderViews()
    } catch (error: unknown) {
      // Match the other seller-action handlers: read the backend's message out of the response
      // body first (axios's own generic "Request failed with status code N" was masking it here).
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Call Uber failed", apiErrorMessage || "Uber delivery could not be created.")
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleCancelDuringDelivery = async (orderItemIds: string[], description: string, options?: CancelOptions) => {
    if (orderItemIds.length === 0) return
    if (options?.cancelingItemId) {
      setCancelingItemId(options.cancelingItemId)
    }
    if (options?.cancelingOrderId) {
      setCancelingOrderId(options.cancelingOrderId)
    }

    try {
      const response = await cancelMutation.mutateAsync(orderItemIds)
      // A malformed 200 (proxy/gateway hiccup) can leave this field missing even though the
      // backend service always sets it on every code path it controls - the wire is not the
      // service.
      const cancelledIds = Array.isArray(response.cancelledOrderItemIds) ? response.cancelledOrderItemIds : []
      patchList((page) => ({ ...page, orders: patchCancelledItems(page.orders, cancelledIds) }))
      showToast.success("Cancellation sent", response.message || description)
      invalidateOtherOrderViews()
    } catch (error: unknown) {
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Cancellation failed", apiErrorMessage || "Cancellation request could not be submitted.")
    } finally {
      if (options?.cancelingItemId) {
        setCancelingItemId(null)
      }
      if (options?.cancelingOrderId) {
        setCancelingOrderId(null)
      }
    }
  }

  const handleConfirmReturn = async (item: VendorOrderItem) => {
    setReturnActionItemId(item.id)
    setReturnActionType("confirm")
    try {
      const response = await confirmReturnMutation.mutateAsync(item.id)
      // See handleCancelDuringDelivery: a malformed 200 can leave this field missing.
      const confirmedIds = Array.isArray(response.orderItemIds) ? response.orderItemIds : []
      patchList((page) => ({ ...page, orders: patchConfirmedReturns(page.orders, confirmedIds) }))
      showToast.success("Return approved", response.message || "Return confirmed and refund created.")
      invalidateOtherOrderViews()
    } catch (error: unknown) {
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Return approval failed", apiErrorMessage || "Return could not be approved.")
    } finally {
      setReturnActionItemId(null)
      setReturnActionType(null)
    }
  }

  const handleRejectReturn = async (orderItemId: string, reason: string) => {
    setReturnActionItemId(orderItemId)
    setReturnActionType("reject")

    try {
      const response = await rejectReturnMutation.mutateAsync({ orderItemId, reason })

      // See handleCancelDuringDelivery: a malformed 200 can leave this field missing.
      const rejectedIds = Array.isArray(response.orderItemIds) ? response.orderItemIds : []
      patchList((page) => ({ ...page, orders: patchRejectedReturns(page.orders, rejectedIds, reason) }))

      showToast.success("Return rejected", response.message || "Return rejected.")
      invalidateOtherOrderViews()
      return true
    } catch (error: unknown) {
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Return rejection failed", apiErrorMessage || "Return could not be rejected.")
      return false
    } finally {
      setReturnActionItemId(null)
      setReturnActionType(null)
    }
  }

  return {
    processingOrderId,
    cancelingItemId,
    cancelingOrderId,
    returnActionItemId,
    returnActionType,
    uberResult,
    setUberResult,
    uberProcessedOrderIds,
    handleCallUber,
    handleCancelDuringDelivery,
    handleConfirmReturn,
    handleRejectReturn,
  }
}
