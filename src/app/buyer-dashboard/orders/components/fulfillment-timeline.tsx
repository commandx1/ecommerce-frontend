"use client"

import { LucideTimer } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import type { BuyerOrderItem } from "@/lib/api/buyer-orders"
import {
  formatRefundStatus,
  getRefundTimelineClass,
  getTimelineDotClass,
  getTimelineLabelClass,
  resolveOrderItemFulfillmentState,
} from "../lib/order-view-utils"

interface FulfillmentTimelineProps {
  item: BuyerOrderItem
  orderDate: string
  orderTime: string
}

export default function FulfillmentTimeline({ item, orderDate, orderTime }: FulfillmentTimelineProps) {
  const prefersReducedMotion = useReducedMotion()
  const timelineState = resolveOrderItemFulfillmentState(item)
  const cancellationLabel = item.cancelledByCustomer
    ? "Cancelled by Customer"
    : item.cancelledBySeller
      ? "Cancelled by Seller"
      : null
  const isCancelledDuringShipping = Boolean(cancellationLabel) && Boolean(item.cancelledWithShippingFee)
  const shippingDotClass = isCancelledDuringShipping ? "bg-danger" : getTimelineDotClass(timelineState.shipping)
  const shippingLabelClass = isCancelledDuringShipping ? "text-danger" : getTimelineLabelClass(timelineState.shipping)
  const cancellationDotClass = "bg-danger"
  const cancellationLabelClass = "text-danger"
  const refundTimeline = item.refundStatus ? getRefundTimelineClass(item.refundStatus) : null
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
            <p className="text-[11px] text-text-muted">
              {orderDate}, {orderTime}
            </p>
          </div>
        </motion.div>
        <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
          <div
            className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${getTimelineDotClass(timelineState.processing)}`}
          />
          <p className={`text-xs font-medium ${getTimelineLabelClass(timelineState.processing)}`}>Processing</p>
        </motion.div>
        {cancellationLabel && !isCancelledDuringShipping ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${cancellationDotClass}`}
            />
            <p className={`text-xs font-medium ${cancellationLabelClass}`}>{cancellationLabel}</p>
          </motion.div>
        ) : null}
        {item.refundStatus && refundTimeline && !isCancelledDuringShipping ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${refundTimeline.dot}`}
            />
            <p className={`text-xs font-medium ${refundTimeline.label}`}>{formatRefundStatus(item.refundStatus)}</p>
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
        {item.refundStatus && refundTimeline && isCancelledDuringShipping ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${refundTimeline.dot}`}
            />
            <p className={`text-xs font-medium ${refundTimeline.label}`}>{formatRefundStatus(item.refundStatus)}</p>
          </motion.div>
        ) : null}
        {!cancellationLabel ? (
          <motion.div {...getTimelineStepMotionProps()} className="relative z-10 flex items-start gap-2.5">
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${getTimelineDotClass(timelineState.delivered)}`}
            />
            <p className={`text-xs font-medium ${getTimelineLabelClass(timelineState.delivered)}`}>Delivered</p>
          </motion.div>
        ) : null}
      </div>
    </>
  )
}
