"use client"

import AddressContactInfo from "@/features/checkout/components/AddressContactInfo"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { hasHeavyShipmentFee } from "@/lib/helpers/shipping"
import type { BuyerOrderViewModel } from "../types"

interface OrderSummaryPanelProps {
  order: BuyerOrder
  summary: BuyerOrderViewModel
}

/** The expanded order's sidebar: who it's shipping to, and the cost breakdown. */
export default function OrderSummaryPanel({ order, summary }: OrderSummaryPanelProps) {
  return (
    <div className="flex w-full flex-col gap-6 lg:w-80">
      <div className="rounded-[8px] border border-border-soft bg-surface-muted/55 p-4 text-left">
        <h4 className="mb-3 text-sm font-semibold text-text-primary">Customer Details</h4>
        <p className="text-sm font-semibold text-text-secondary">
          {order.shipmentAddress?.fullName || summary.customerLabel}
        </p>
        <AddressContactInfo
          className="mt-2"
          address={summary.shippingAddress.line}
          phone={order.shipmentAddress?.phoneNumber}
        />
      </div>

      <div className="rounded-[8px] border border-border-soft bg-surface-muted/55 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span className="text-text-primary">{formatCurrency(summary.itemTotal)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Shipping</span>
            <span className="text-text-primary">
              {summary.shippingTotal > 0 ? formatCurrency(summary.shippingTotal) : "FREE"}
            </span>
          </div>
          {hasHeavyShipmentFee(summary.heavyShipmentTotal) ? (
            <div className="flex justify-between text-text-muted">
              <span>Heavy shipment fee</span>
              <span className="text-text-primary">{formatCurrency(summary.heavyShipmentTotal)}</span>
            </div>
          ) : null}
          {summary.taxTotal > 0 ? (
            <div className="flex justify-between text-text-muted">
              <span>Tax</span>
              <span className="text-text-primary">{formatCurrency(summary.taxTotal)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-border-soft pt-2 font-semibold">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary">
              {formatCurrency(
                summary.totalAmountFromItemPrices +
                  summary.shippingTotal +
                  summary.heavyShipmentTotal +
                  summary.taxTotal,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
