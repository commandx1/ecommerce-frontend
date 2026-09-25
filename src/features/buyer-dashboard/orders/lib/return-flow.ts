import type { BuyerOrderItem } from "@/lib/api/buyer-orders"

export function hasOrderItemReturnFlowStarted(item: BuyerOrderItem): boolean {
  const hasReturnDate = typeof item.returnDate === "string" && item.returnDate.trim().length > 0
  const hasReturnStatus = typeof item.returnRefundStatus === "string" && item.returnRefundStatus.trim().length > 0
  const hasLegacyRefundStatus = typeof item.refundStatus === "string" && item.refundStatus.trim().length > 0

  return hasReturnDate || hasReturnStatus || hasLegacyRefundStatus
}
