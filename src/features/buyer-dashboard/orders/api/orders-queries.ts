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
 * `GET /orders/buyer` (Phase 4 design doc §2.1/B4c). `staleTime: 0, gcTime: 0, retry: false`
 * (§2.2 fetch policy parity, no `keepPreviousData`): every tab/page/sort/orderId change is a
 * fresh mount-shaped fetch, so the table/mobile list show their skeleton instead of stale rows -
 * unlike vendor orders, which keeps rows across a page change. `enabled` reproduces the old
 * effect's `if (!isAuthenticated) return` guard; while disabled, `isPending` stays true, which is
 * what the old page's permanent skeleton did for a signed-out visit.
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
      // Array.isArray, not `?? []` - see infra note #26 (order-view-utils history): a malformed
      // 200 carrying a wrong-typed truthy value must not reach `.map()`/`.length` downstream.
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

/**
 * `{ refetchType: "none" }`: marks every other cached list entry (other tabs/pages/sorts) stale
 * without refetching them now - the next mount on that tab/page fetches fresh, same as today,
 * with no extra GET fired here (§2.3).
 */
async function invalidateOrderLists(): Promise<void> {
  await getQueryClient().invalidateQueries({ queryKey: queryKeys.orders.all, refetchType: "none" })
}

/**
 * Order writes (Phase 4 §2.3/B4c). Both patch the CURRENT list's cache entry directly with the
 * pure `lib/order-patches` functions - no extra GET, matching what the old hook's local
 * `setOrders` did - then invalidate every other cached list entry without refetching.
 */
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
    // Array.isArray, not `?? []` - see infra note #26.
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
