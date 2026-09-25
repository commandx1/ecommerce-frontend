/** Pure step-resolution/class helpers for `FulfillmentTimeline`, shared by buyer and vendor orders. */

export type FulfillmentStepState = "pending" | "active" | "done"

export interface OrderItemFulfillmentInput {
  status: string
  cancelledByCustomer?: boolean | null
  cancelledBySeller?: boolean | null
  cancelledWithShippingFee?: boolean | null
}

export function resolveOrderItemFulfillmentState(item: OrderItemFulfillmentInput): {
  processing: FulfillmentStepState
  shipping: FulfillmentStepState
  delivered: FulfillmentStepState
} {
  // A non-string status must degrade, not throw.
  const normalizedStatus = typeof item?.status === "string" ? item.status.toUpperCase() : ""
  const isCancelled =
    Boolean(item.cancelledByCustomer) || Boolean(item.cancelledBySeller) || normalizedStatus.includes("CANCEL")
  const isCancelledDuringShipping = isCancelled && Boolean(item.cancelledWithShippingFee)

  if (normalizedStatus.includes("DELIVER")) {
    return { processing: "done", shipping: "done", delivered: "done" }
  }

  const isOnWay = normalizedStatus.includes("ON_WAY")
  const isShipped =
    isOnWay ||
    ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY"].some((token) => normalizedStatus.includes(token))

  if (isOnWay) {
    return { processing: "done", shipping: "active", delivered: "pending" }
  }

  if (isShipped) {
    return { processing: "done", shipping: "done", delivered: "pending" }
  }

  if (isCancelledDuringShipping) {
    return { processing: "done", shipping: "done", delivered: "pending" }
  }

  if (isCancelled) {
    return { processing: "done", shipping: "pending", delivered: "pending" }
  }

  return { processing: "active", shipping: "pending", delivered: "pending" }
}

export function getTimelineDotClass(state: FulfillmentStepState): string {
  if (state === "done") return "bg-success"
  if (state === "active") return "bg-warning animate-pulse"
  return "bg-border-soft"
}

export function getTimelineLabelClass(state: FulfillmentStepState): string {
  if (state === "done") return "text-success"
  if (state === "active") return "text-warning"
  return "text-text-muted"
}

export function getRefundTimelineClass(refundStatus: string): { dot: string; label: string } {
  const normalizedStatus = typeof refundStatus === "string" ? refundStatus.toUpperCase() : ""

  if (normalizedStatus === "APPROVED") {
    return { dot: "bg-success", label: "text-success" }
  }

  if (normalizedStatus === "CANCELLED") {
    return { dot: "bg-danger", label: "text-danger" }
  }

  return { dot: "bg-warning animate-pulse", label: "text-warning" }
}
