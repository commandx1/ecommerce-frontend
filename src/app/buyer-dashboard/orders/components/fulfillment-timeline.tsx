"use client"

import { CircleHelp, LucideTimer } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HorizontalTimeline } from "@/components/ui/horizontal-timeline"
import type { HorizontalTimelineStep } from "@/components/ui/horizontal-timeline"
import {
  formatDateOnly,
  resolveOrderItemFulfillmentState,
} from "../lib/order-view-utils"

interface FulfillmentTimelineItem {
  status: string
  deliveredDate?: string | null
  refundStatus?: string | null
  returnRefundStatus?: string | null
  returnDate?: string | null
  returnReason?: string | null
  returnRejectReason?: string | null
  returnRejectDate?: string | null
  cancelledByCustomer?: boolean | null
  cancelledBySeller?: boolean | null
  cancelledWithShippingFee?: boolean | null
  updatedDate?: string | null
}

interface FulfillmentTimelineProps {
  item: FulfillmentTimelineItem
  orderDate: string
}

function ReturnReasonTooltip({ reason, variant }: { reason: string; variant: "return" | "reject" }) {
  const isReturn = variant === "return"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 ${isReturn ? "text-brand/85 hover:text-brand focus-visible:ring-brand/35" : "text-danger/90 hover:text-danger focus-visible:ring-danger/35"}`}
          aria-label={isReturn ? "Show return reason" : "Show reject reason"}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className={isReturn ? "border-brand/60 bg-background shadow-lg" : "border-danger/60 bg-background shadow-lg"}
      >
        <p className={`text-[11px] font-semibold ${isReturn ? "text-brand" : "text-danger"}`}>
          {isReturn ? "Return Reason" : "Reject Reason"}
        </p>
        <p className={`mt-0.5 text-[11px] ${isReturn ? "text-brand/90" : "text-danger/90"}`}>{reason}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default function FulfillmentTimeline({ item, orderDate }: FulfillmentTimelineProps) {
  const timelineState = resolveOrderItemFulfillmentState(item)
  const normalizedItemStatus = item.status.toUpperCase()
  const deliveredDate = item.deliveredDate ? formatDateOnly(item.deliveredDate) : null
  const returnRefundStatus = (item.returnRefundStatus ?? item.refundStatus ?? null)?.toUpperCase() ?? null
  const returnDate = item.returnDate ? formatDateOnly(item.returnDate) : null
  const returnReason = typeof item.returnReason === "string" ? item.returnReason.trim() : ""
  const returnRejectReason = typeof item.returnRejectReason === "string" ? item.returnRejectReason.trim() : ""
  const returnRejectDate = item.returnRejectDate ? formatDateOnly(item.returnRejectDate) : null
  const cancellationLabel = item.cancelledByCustomer
    ? "Cancelled by Customer"
    : item.cancelledBySeller
      ? "Cancelled by Seller"
      : null
  const cancellationDate = cancellationLabel && item.updatedDate ? formatDateOnly(item.updatedDate) : null
  const isCancelledDuringShipping = Boolean(cancellationLabel) && Boolean(item.cancelledWithShippingFee)
  const hasReturnFlow = Boolean(returnRefundStatus || (returnDate && returnDate !== "-"))
  const effectiveTimelineState: typeof timelineState =
    hasReturnFlow && !cancellationLabel
      ? { processing: "done", shipping: "done", delivered: "done" }
      : timelineState
  const isReturnRejected =
    returnRefundStatus === "REJECTED_BY_SELLER" ||
    returnRefundStatus === "REJECTED_BY_STRIPE" ||
    returnRefundStatus === "CANCELLED"
  const isReturnApproved = returnRefundStatus === "APPROVED" || normalizedItemStatus === "RETURNED"
  const isReturned = normalizedItemStatus === "RETURNED"
  const isReturnDelivered = returnRefundStatus === "DELIVERED" || isReturnApproved
  const showDecisionStep = isReturnApproved || isReturnRejected

  const steps: HorizontalTimelineStep[] = []

  // Step 1: Order Placed
  steps.push({
    label: "Placed",
    date: orderDate,
    state: "done",
  })

  // Step 2: Processing
  steps.push({
    label: "Processing",
    state:
      effectiveTimelineState.processing === "done"
        ? "done"
        : effectiveTimelineState.processing === "active"
          ? "active"
          : "pending",
  })

  // Cancellation before shipping
  if (cancellationLabel && !isCancelledDuringShipping) {
    steps.push({
      label: cancellationLabel,
      date: cancellationDate ?? undefined,
      state: "error",
    })
    return (
      <div>
        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <LucideTimer className="h-3.5 w-3.5 text-success" />
          Fulfillment
        </div>
        <HorizontalTimeline steps={steps} />
      </div>
    )
  }

  // Step 3: Shipping
  steps.push({
    label: "Shipping",
    state: isCancelledDuringShipping
      ? "done"
      : effectiveTimelineState.shipping === "done"
        ? "done"
        : effectiveTimelineState.shipping === "active"
          ? "active"
          : "pending",
  })

  // Cancellation during shipping
  if (cancellationLabel && isCancelledDuringShipping) {
    steps.push({
      label: cancellationLabel,
      date: cancellationDate ?? undefined,
      state: "error",
    })
    return (
      <div>
        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <LucideTimer className="h-3.5 w-3.5 text-success" />
          Fulfillment
        </div>
        <HorizontalTimeline steps={steps} />
      </div>
    )
  }

  // Step 4: Delivered
  steps.push({
    label: "Delivered",
    date: deliveredDate ?? undefined,
    state:
      effectiveTimelineState.delivered === "done"
        ? "done"
        : effectiveTimelineState.delivered === "active"
          ? "active"
          : "pending",
  })

  // Return flow steps
  if (hasReturnFlow) {
    steps.push({
      label: "Return",
      date: returnDate ?? undefined,
      state: "done",
      extra: returnReason ? <ReturnReasonTooltip reason={returnReason} variant="return" /> : null,
    })

    if (isReturnDelivered) {
      steps.push({
        label: "Return Ship.",
        sublabel: "Delivered",
        state: isReturnRejected ? "error" : "done",
      })
    }

    if (showDecisionStep) {
      steps.push({
        label: isReturnApproved ? "Approved" : "Rejected",
        date: !isReturnApproved && returnRejectDate ? returnRejectDate : undefined,
        state: isReturnApproved ? "done" : "error",
        extra:
          !isReturnApproved && returnRejectReason ? (
            <ReturnReasonTooltip reason={returnRejectReason} variant="reject" />
          ) : null,
      })
    }

    if (isReturned) {
      steps.push({ label: "Returned", state: "done" })
    }
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
        <LucideTimer className="h-3.5 w-3.5 text-success" />
        Fulfillment
      </div>
      <HorizontalTimeline steps={steps} />
    </div>
  )
}
