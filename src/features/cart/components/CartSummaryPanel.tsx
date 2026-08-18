import { Loader2, Repeat } from "lucide-react"
import Link from "next/link"
import NotificationCard from "@/components/feedback/NotificationCard"
import ActionButton from "@/components/ui/ActionButton"
import SurfaceCard from "@/components/ui/SurfaceCard"
import type { CartTotals } from "@/features/cart/types"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartSummaryPanelProps {
  autoOrderItemsCount: number
  blockingItemsCount: number
  hasBlockingItems: boolean
  isCheckoutDisabled: boolean
  isLicenseBlocked: boolean
  isTaxLoading: boolean
  itemsCount: number
  onCheckout: () => void
  totals: CartTotals
}

interface SummaryRow {
  isLoading?: boolean
  label: string
  value: string
}

export default function CartSummaryPanel({
  autoOrderItemsCount,
  blockingItemsCount,
  hasBlockingItems,
  isCheckoutDisabled,
  isLicenseBlocked,
  isTaxLoading,
  itemsCount,
  onCheckout,
  totals,
}: CartSummaryPanelProps) {
  const summaryRows: SummaryRow[] = [
    { label: `Subtotal (${itemsCount} items)`, value: formatCurrency(totals.subtotal) },
    { label: "Shipment fee", value: totals.shipmentFee === 0 ? "Free" : formatCurrency(totals.shipmentFee) },
    {
      label: "Heavy shipment fee",
      value: totals.heavyShipmentFee === 0 ? "Free" : formatCurrency(totals.heavyShipmentFee),
    },
    {
      label: "Total shipment fee",
      value: totals.totalShipmentFee === 0 ? "Free" : formatCurrency(totals.totalShipmentFee),
    },
    { label: "Estimated Tax", value: formatCurrency(totals.tax), isLoading: isTaxLoading },
  ]

  return (
    <SurfaceCard variant="technical" className="sticky top-6 p-6">
      <h3 className="mb-6 text-xl font-bold text-text-primary">Order Summary</h3>
      <div className="mb-6 space-y-3">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-text-secondary">{row.label}</span>
            {row.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
            ) : (
              <span className="font-medium text-text-primary">{row.value}</span>
            )}
          </div>
        ))}
        <div className="border-t border-border-soft pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-text-primary">Total</span>
            <span className="text-lg font-bold text-brand">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
      {autoOrderItemsCount > 0 ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2">
          <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">
              {autoOrderItemsCount} item{autoOrderItemsCount > 1 ? "s" : ""} set to repeat.
            </span>{" "}
            You'll confirm automatic payments at checkout, and you can pause or cancel anytime.
          </p>
        </div>
      ) : null}
      {hasBlockingItems ? (
        <NotificationCard
          tone="error"
          title="Checkout is blocked"
          description={`Remove ${blockingItemsCount} unavailable item${blockingItemsCount > 1 ? "s" : ""} to continue.`}
          className="mb-4 rounded-lg px-3 py-2"
        />
      ) : null}
      {isLicenseBlocked ? (
        <NotificationCard
          tone="warning"
          title="Dental license required"
          description="One or more items in your cart require a valid, approved dental license. Add or wait for approval of your license to continue."
          className="mb-4 rounded-lg px-3 py-2"
        >
          <Link
            href="/buyer-dashboard/settings"
            className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
          >
            Add your license
          </Link>
        </NotificationCard>
      ) : null}
      <ActionButton
        type="button"
        disabled={isCheckoutDisabled}
        onClick={onCheckout}
        fullWidth
        className="text-lg disabled:bg-surface-muted disabled:text-text-muted"
      >
        Proceed to Checkout
      </ActionButton>
    </SurfaceCard>
  )
}
