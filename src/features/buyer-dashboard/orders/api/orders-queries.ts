import { queryOptions } from "@tanstack/react-query"
import {
  type BuyerOrder,
  buyerOrdersAPI,
  type CancelDuringDeliveryByCustomerPayload,
  type CancelDuringDeliveryByCustomerResponse,
  type RefundOrderPayload,
  type RefundOrderResponse,
} from "@/lib/api/buyer-orders"
import { type BuyerOrderListParams, queryKeys } from "@/lib/query/keys"
import { getQueryClient } from "@/lib/query/query-client"
import { applyRefundSubmitted, markItemsCancelRequested } from "../lib/order-patches"

export interface BuyerOrdersListResult {
  orders: BuyerOrder[]
  totalPages: number
  totalElements: number
}

/**
 * No `keepPreviousData`: every tab/page/sort/orderId change shows the skeleton instead of stale
 * rows (unlike vendor orders). While disabled (signed out) `isPending` stays true, so the skeleton
 * stays up.
 */
export function buyerOrdersListOptions(params: BuyerOrderListParams, enabled: boolean) {
  return queryOptions<BuyerOrdersListResult>({
    queryKey: queryKeys.orders.list(params),
    queryFn: async ({ signal }) => {
      const response = await buyerOrdersAPI.getBuyerOrders(
        params.page,
        params.size,
        params.sortBy,
        params.sortDir,
        params.type,
        signal,
        params.orderId ?? undefined,
      )
      // A malformed 200 carrying a wrong-typed value must not reach `.map()`/`.length` downstream.
      return {
        orders: Array.isArray(response.orders) ? response.orders : [],
        totalPages: typeof response.totalPages === "number" ? response.totalPages : 0,
        totalElements: typeof response.totalElements === "number" ? response.totalElements : 0,
      }
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

/** Marks every other cached list entry stale without refetching it now. */
async function invalidateOrderLists(): Promise<void> {
  await getQueryClient().invalidateQueries({ queryKey: queryKeys.orders.all, refetchType: "none" })
}

/** Both writes patch the CURRENT list's cache entry (no extra GET), then stale the other entries. */
export const ordersCommands = {
  async cancelDuringDeliveryByCustomer(
    params: BuyerOrderListParams,
    payload: CancelDuringDeliveryByCustomerPayload,
  ): Promise<CancelDuringDeliveryByCustomerResponse> {
    const response = await buyerOrdersAPI.cancelDuringDeliveryByCustomer(payload)
    const cancelledOrderItemIds = new Set(
      Array.isArray(response.cancelledOrderItemIds) ? response.cancelledOrderItemIds : [],
    )

    getQueryClient().setQueryData<BuyerOrdersListResult>(queryKeys.orders.list(params), (current) =>
      current ? { ...current, orders: markItemsCancelRequested(current.orders, cancelledOrderItemIds) } : current,
    )
    await invalidateOrderLists()

    return response
  },

  async refundOrder(
    params: BuyerOrderListParams,
    payload: RefundOrderPayload,
    orderId: string,
  ): Promise<RefundOrderResponse> {
    const response = await buyerOrdersAPI.refundOrder(payload)
    const refundedItemIds = new Set(payload.items.map((item) => item.orderItemId))
    const refundReasonByOrderItemId = new Map(payload.items.map((item) => [item.orderItemId, item.returnReason]))
    const submittedAt = new Date().toISOString()
    const linksByItemId = new Map(
      (Array.isArray(response.itemLinks) ? response.itemLinks : []).map((link) => [link.orderItemId, link]),
    )

    getQueryClient().setQueryData<BuyerOrdersListResult>(queryKeys.orders.list(params), (current) =>
      current
        ? {
            ...current,
            orders: applyRefundSubmitted(current.orders, {
              orderId,
              refundedItemIds,
              refundReasonByOrderItemId,
              submittedAt,
              linksByItemId,
            }),
          }
        : current,
    )
    await invalidateOrderLists()

    return response
  },
}
