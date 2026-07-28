"use client"

import { CircleHelp, ListTree, LucideTimer } from "lucide-react"
import { useState } from "react"
import type { HorizontalTimelineStep } from "@/components/ui/horizontal-timeline"
import { HorizontalTimeline } from "@/components/ui/horizontal-timeline"
import Modal from "@/components/ui/Modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDateOnly, resolveOrderItemFulfillmentState } from "../lib/order-view-utils"

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
  // Radix's Tooltip is hover/keyboard-focus driven: it opens on focus (which fires *before* click,
  // including a dialog's initial autofocus) and its own onClick always closes it, which made this
  // unreliable both on mount (opened unexpectedly) and on tap (toggled twice per click). Popover is
  // the correct primitive here — it opens/closes purely on click/tap and only on genuine intent.
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 ${isReturn ? "text-brand/85 hover:text-brand focus-visible:ring-brand/35" : "text-danger/90 hover:text-danger focus-visible:ring-danger/35"}`}
          aria-label={isReturn ? "Show return reason" : "Show reject reason"}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className={`w-auto max-w-xs px-2.5 py-1.5 ${isReturn ? "border-brand/60 bg-background shadow-lg" : "border-danger/60 bg-background shadow-lg"}`}
      >
        <p className={`text-[11px] font-semibold ${isReturn ? "text-brand" : "text-danger"}`}>
          {isReturn ? "Return Reason" : "Reject Reason"}
        </p>
        <p className={`mt-0.5 text-[11px] ${isReturn ? "text-brand/90" : "text-danger/90"}`}>{reason}</p>
      </PopoverContent>
    </Popover>
  )
}

function getCurrentStepSummary(steps: HorizontalTimelineStep[]) {
  const active = [...steps].reverse().find((step) => step.state === "active")
  if (active) return active
  const errored = [...steps].reverse().find((step) => step.state === "error")
  if (errored) return errored
  const done = [...steps].reverse().find((step) => step.state === "done")
  return done ?? steps[steps.length - 1] ?? steps[0]
}

function FulfillmentTimelineView({ steps }: { steps: HorizontalTimelineStep[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const currentStep = getCurrentStepSummary(steps)
  const stateDotClass =
    currentStep?.state === "error"
      ? "bg-danger"
      : currentStep?.state === "active"
        ? "bg-brand animate-pulse"
        : "bg-success"

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
        <LucideTimer className="h-3.5 w-3.5 text-success" />
        Fulfillment
      </div>

      {/* Desktop / tablet: full horizontal timeline */}
      <div className="hidden md:block">
        <HorizontalTimeline steps={steps} />
      </div>

      {/* Mobile: compact status + button that opens a vertical timeline modal */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border-soft bg-surface px-3 py-2.5 text-left transition-colors active:bg-surface-muted"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${stateDotClass}`} />
            <span className="min-w-0 truncate text-xs font-semibold text-text-primary">
              {currentStep?.label ?? "Fulfillment"}
            </span>
            {currentStep?.date && currentStep.date !== "-" ? (
              <span className="shrink-0 text-[11px] text-text-muted">{currentStep.date}</span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand">
            <ListTree className="h-3.5 w-3.5" />
            View
          </span>
        </button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Fulfillment Timeline"
          maxWidthClassName="max-w-sm"
          preventAutoFocus
        >
          <div className="p-5">
            <div className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <LucideTimer className="h-4 w-4 text-success" />
              Fulfillment Timeline
            </div>
            <HorizontalTimeline steps={steps} orientation="vertical" />
          </div>
        </Modal>
      </div>
    </div>
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
    hasReturnFlow && !cancellationLabel ? { processing: "done", shipping: "done", delivered: "done" } : timelineState
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
    return <FulfillmentTimelineView steps={steps} />
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
    return <FulfillmentTimelineView steps={steps} />
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

  return <FulfillmentTimelineView steps={steps} />
}
