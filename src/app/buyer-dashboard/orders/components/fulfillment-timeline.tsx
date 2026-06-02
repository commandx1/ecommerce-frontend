"use client"

import { CircleHelp, LucideTimer } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  formatDateOnly,
  getTimelineDotClass,
  getTimelineLabelClass,
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
}

interface FulfillmentTimelineProps {
  item: FulfillmentTimelineItem
  orderDate: string
}

export default function FulfillmentTimeline({ item, orderDate }: FulfillmentTimelineProps) {
  const prefersReducedMotion = useReducedMotion()
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
  const isCancelledDuringShipping = Boolean(cancellationLabel) && Boolean(item.cancelledWithShippingFee)
  const hasReturnFlow = Boolean(returnRefundStatus || (returnDate && returnDate !== "-"))
  const effectiveTimelineState: typeof timelineState =
    hasReturnFlow && !cancellationLabel
      ? { processing: "done", shipping: "done", delivered: "done" }
      : timelineState
  const shippingDotClass = isCancelledDuringShipping ? "bg-danger" : getTimelineDotClass(effectiveTimelineState.shipping)
  const shippingLabelClass = isCancelledDuringShipping ? "text-danger" : getTimelineLabelClass(effectiveTimelineState.shipping)
  const cancellationDotClass = "bg-danger"
  const cancellationLabelClass = "text-danger"
  const isReturnRejected =
    returnRefundStatus === "REJECTED_BY_SELLER" ||
    returnRefundStatus === "REJECTED_BY_STRIPE" ||
    returnRefundStatus === "CANCELLED"
  const isReturnApproved = returnRefundStatus === "APPROVED" || normalizedItemStatus === "RETURNED"
  const isReturned = normalizedItemStatus === "RETURNED"
  const isReturnDelivered = returnRefundStatus === "DELIVERED" || isReturnApproved
  const returnCreatedDotClass = "bg-brand"
  const returnCreatedLabelClass = "text-brand"
  const returnShipmentDotClass = isReturnRejected
    ? "bg-danger"
    : isReturnDelivered
      ? "bg-success"
      : "bg-border-soft"
  const returnShipmentLabelClass = isReturnRejected
    ? "text-danger"
    : isReturnDelivered
      ? "text-success"
      : "text-text-muted"
  const returnShipmentStatusLabel = "DELIVERED"
  const showReturnShipmentStep = isReturnDelivered
  const decisionDotClass = isReturnApproved ? "bg-success" : "bg-danger"
  const decisionLabelClass = isReturnApproved ? "text-success" : "text-danger"
  const showDecisionStep = isReturnApproved || isReturnRejected
  const returnedDotClass = "bg-success"
  const returnedLabelClass = "text-success"
  let timelineStepIndex = 0

  const getTimelineStepMotionProps = () => {
    if (prefersReducedMotion) return {}

    const expandPanelDuration = 0.32
    const expandPanelBuffer = 0.03
    const delay = expandPanelDuration + expandPanelBuffer + timelineStepIndex * 0.07
    timelineStepIndex += 1

    return {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: 0.24,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }
  }

  return (
    <>
      <div className="mb-2 flex items-start gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <LucideTimer className="h-3.5 w-3.5 text-success" />
          Fulfillment
        </div>
      </div>
      <div className="relative space-y-2.5 ps-0.5 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-border-soft before:content-['']">
        <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-surface-elevated bg-success shadow-sm" />
          <div>
            <p className="text-xs font-semibold text-success">Order Placed</p>
            <p className="text-[11px] text-text-muted">{orderDate}</p>
          </div>
        </motion.div>
        <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
          <div
            className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${getTimelineDotClass(effectiveTimelineState.processing)}`}
          />
          <p className={`text-xs font-medium ${getTimelineLabelClass(effectiveTimelineState.processing)}`}>Processing</p>
        </motion.div>
        {cancellationLabel && !isCancelledDuringShipping ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${cancellationDotClass}`}
            />
            <p className={`text-xs font-medium ${cancellationLabelClass}`}>{cancellationLabel}</p>
          </motion.div>
        ) : null}
        {!cancellationLabel || isCancelledDuringShipping ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${shippingDotClass}`}
            />
            <p className={`text-xs font-medium ${shippingLabelClass}`}>Shipping</p>
          </motion.div>
        ) : null}
        {cancellationLabel && isCancelledDuringShipping ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${cancellationDotClass}`}
            />
            <p className={`text-xs font-medium ${cancellationLabelClass}`}>{cancellationLabel}</p>
          </motion.div>
        ) : null}
        {!cancellationLabel ? (
          <>
            <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
              <div
                className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${getTimelineDotClass(effectiveTimelineState.delivered)}`}
              />
              <div>
                <p className={`text-xs font-medium ${getTimelineLabelClass(effectiveTimelineState.delivered)}`}>Delivered</p>
                {deliveredDate && deliveredDate !== "-" ? <p className="text-[11px] text-text-muted">{deliveredDate}</p> : null}
              </div>
            </motion.div>
            {hasReturnFlow ? (
              <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${returnCreatedDotClass}`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-medium ${returnCreatedLabelClass}`}>Return Created</p>
                    {returnReason ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-brand/85 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
                            aria-label="Show return reason"
                          >
                            <CircleHelp className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="border-brand/60 bg-background text-primary-foreground shadow-lg">
                          <p className="text-[11px] font-semibold text-brand">Return Reason</p>
                          <p className="mt-0.5 text-[11px] text-brand/90">{returnReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                  {returnDate && returnDate !== "-" ? <p className="text-[11px] text-text-muted">{returnDate}</p> : null}
                </div>
              </motion.div>
            ) : null}
            {showReturnShipmentStep ? (
              <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${returnShipmentDotClass}`}
                />
                <div>
                  <p className={`text-xs font-medium ${returnShipmentLabelClass}`}>Return Shipment</p>
                  <p className={`text-[11px] font-medium ${returnShipmentLabelClass}`}>{returnShipmentStatusLabel}</p>
                </div>
              </motion.div>
            ) : null}
            {showDecisionStep ? (
              <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
                <div className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${decisionDotClass}`} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-medium ${decisionLabelClass}`}>
                      {isReturnApproved ? "Return Approved" : "Return Rejected"}
                    </p>
                    {!isReturnApproved && returnRejectReason ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-danger/90 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/35"
                            aria-label="Show reject reason"
                          >
                            <CircleHelp className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="border-danger/60 bg-background text-danger shadow-lg">
                          <p className="text-[11px] font-semibold text-danger">Reject Reason</p>
                          <p className="mt-0.5 text-[11px] text-danger/90">{returnRejectReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                  {!isReturnApproved && returnRejectDate && returnRejectDate !== "-" ? (
                    <p className="text-[11px] text-text-muted">{returnRejectDate}</p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
            {isReturned ? (
              <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
                <div className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${returnedDotClass}`} />
                <p className={`text-xs font-medium ${returnedLabelClass}`}>Returned</p>
              </motion.div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}
