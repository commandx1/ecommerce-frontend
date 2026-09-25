import type { BuyerOrder, BuyerOrderItem, RefundOrderItemLinks } from "@/lib/api/buyer-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"

/**
 * Pure cache patch (Phase 4 §2.3/B4c), extracted from the old hook's inline `setOrders`
 * callback for `handleCancelDuringDelivery`. Flips every order item in `cancelledOrderItemIds`
 * to `CANCEL_REQUESTED`, across both the legacy flat `orderItems` list and the nested
 * `sellerGroups[].orderItems` shape - same dual-write the old page did, since the backend can
 * serve either shape.
 */
export function markItemsCancelRequested(orders: BuyerOrder[], cancelledOrderItemIds: Set<string>): BuyerOrder[] {
  return orders.map((order) => ({
    ...order,
    sellerGroups: Array.isArray(order.sellerGroups)
      ? order.sellerGroups.map((group) => ({
          ...group,
          orderItems: Array.isArray(group.orderItems)
            ? group.orderItems.map((orderItem) =>
                cancelledOrderItemIds.has(orderItem.id)
                  ? { ...orderItem, status: OrderItemStatus.CANCEL_REQUESTED }
                  : orderItem,
              )
            : [],
        }))
      : order.sellerGroups,
    orderItems: Array.isArray(order.orderItems)
      ? order.orderItems.map((orderItem) =>
          cancelledOrderItemIds.has(orderItem.id)
            ? { ...orderItem, status: OrderItemStatus.CANCEL_REQUESTED }
            : orderItem,
        )
      : order.orderItems,
  }))
}

export interface RefundSubmittedPatch {
  orderId: string
  refundedItemIds: Set<string>
  refundReasonByOrderItemId: Map<string, string>
  submittedAt: string
  linksByItemId: Map<string, RefundOrderItemLinks>
}

/**
 * Pure cache patch, extracted from the old hook's inline `setOrders` callback for
 * `submitRefundOrder`. Only touches the order matching `orderId`, marks every refunded item
 * pending, and carries through any return tracking/shipping links the backend returned.
 */
export function applyRefundSubmitted(orders: BuyerOrder[], patch: RefundSubmittedPatch): BuyerOrder[] {
  const { orderId, refundedItemIds, refundReasonByOrderItemId, submittedAt, linksByItemId } = patch

  const applyUpdate = (item: BuyerOrderItem): BuyerOrderItem => {
    if (!refundedItemIds.has(item.id)) return item
    const links = linksByItemId.get(item.id)
    return {
      ...item,
      refundStatus: "PENDING",
      returnRefundStatus: "PENDING",
      returnReason: refundReasonByOrderItemId.get(item.id) ?? item.returnReason ?? null,
      returnDate: submittedAt,
      ...(links?.returnTrackingLinks && { returnTrackingLinks: links.returnTrackingLinks }),
      ...(links?.returnShippingLinks && { returnShippingLinks: links.returnShippingLinks }),
    }
  }

  return orders.map((order) => {
    if (order.orderId !== orderId) {
      return order
    }

    return {
      ...order,
      sellerGroups: Array.isArray(order.sellerGroups)
        ? order.sellerGroups.map((group) => ({
            ...group,
            orderItems: Array.isArray(group.orderItems) ? group.orderItems.map(applyUpdate) : [],
          }))
        : order.sellerGroups,
      orderItems: Array.isArray(order.orderItems) ? order.orderItems.map(applyUpdate) : order.orderItems,
    }
  })
}
