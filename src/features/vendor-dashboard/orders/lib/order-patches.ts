import type { VendorOrder } from "@/lib/api/vendor-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"

/** Same field patch `handleCancelDuringDelivery` applied to page-local state before this moved
 * into the cache: every item whose id the backend confirmed cancelling moves to
 * CANCEL_REQUESTED, everything else is untouched. */
export function patchCancelledItems(orders: VendorOrder[], cancelledOrderItemIds: string[]): VendorOrder[] {
  return orders.map((order) => ({
    ...order,
    orderItems: order.orderItems.map((item) =>
      cancelledOrderItemIds.includes(item.id) ? { ...item, status: OrderItemStatus.CANCEL_REQUESTED } : item,
    ),
  }))
}

/** Same field patch `handleConfirmReturn` applied before this moved into the cache. */
export function patchConfirmedReturns(orders: VendorOrder[], confirmedOrderItemIds: string[]): VendorOrder[] {
  return orders.map((order) => ({
    ...order,
    orderItems: order.orderItems.map((item) =>
      confirmedOrderItemIds.includes(item.id)
        ? { ...item, returnRefundStatus: "APPROVED", sellerConfirmedReturn: true, returnRejectReason: null }
        : item,
    ),
  }))
}

/** Same field patch `handleRejectReturn` applied before this moved into the cache. */
export function patchRejectedReturns(
  orders: VendorOrder[],
  rejectedOrderItemIds: string[],
  reason: string,
): VendorOrder[] {
  const returnRejectDate = new Date().toISOString()
  return orders.map((order) => ({
    ...order,
    orderItems: order.orderItems.map((item) =>
      rejectedOrderItemIds.includes(item.id)
        ? { ...item, returnRefundStatus: "REJECTED_BY_SELLER", returnRejectReason: reason, returnRejectDate }
        : item,
    ),
  }))
}
