import { Loader2, Repeat } from "lucide-react"
import NotificationCard from "@/components/feedback/NotificationCard"
import ActionButton from "@/components/ui/ActionButton"
import SurfaceCard from "@/components/ui/SurfaceCard"
import DentalLicenseNotice from "@/features/cart/components/DentalLicenseNotice"
import type { CartTotals } from "@/features/cart/types"
import type { DentalLicenseStatus } from "@/lib/helpers/dentalLicense"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartSummaryPanelProps {
  autoOrderItemsCount: number
  blockingItemsCount: number
  hasBlockingItems: boolean
  isCheckoutDisabled: boolean
  isLicenseBlocked: boolean
  isLicenseChecking: boolean
  licenseCheckFailed: boolean
  licenseStatus: DentalLicenseStatus | null
  licenseRejectionReason: string | null
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
  isLicenseChecking,
  licenseCheckFailed,
  licenseStatus,
  licenseRejectionReason,
  isTaxLoading,
  itemsCount,
  onCheckout,
  totals,
}: CartSummaryPanelProps) {
  // null = tax could not be estimated yet (no address, or the estimate call failed) — render as
  // "calculated at checkout", not $0.00.
  const taxValue = totals.tax === null ? "Calculated at checkout" : formatCurrency(totals.tax)

  const summaryRows: SummaryRow[] = [
    { label: `Subtotal (${itemsCount} item${itemsCount > 1 ? "s" : ""})`, value: formatCurrency(totals.subtotal) },
    { label: "Shipment fee", value: totals.shipmentFee === 0 ? "Free" : formatCurrency(totals.shipmentFee) },
    ...(totals.heavyShipmentFee > 0
      ? [{ label: "Heavy shipment fee", value: formatCurrency(totals.heavyShipmentFee) }]
      : []),
    { label: "Estimated Tax", value: taxValue, isLoading: isTaxLoading },
  ]

  return (
    <SurfaceCard variant="technical" className="sticky top-[calc(var(--header-height)+1rem)] p-6">
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
          {!isTaxLoading && totals.tax === null ? (
            <p className="mt-1 text-right text-xs text-text-secondary">Excludes tax — calculated at checkout.</p>
          ) : null}
        </div>
      </div>
      {autoOrderItemsCount > 0 ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2">
          <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">
              {autoOrderItemsCount} item{autoOrderItemsCount > 1 ? "s" : ""} set to auto order.
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
        <DentalLicenseNotice
          licenseCheckFailed={licenseCheckFailed}
          licenseStatus={licenseStatus}
          licenseRejectionReason={licenseRejectionReason}
        />
      ) : null}
      <ActionButton
        type="button"
        disabled={isCheckoutDisabled || isLicenseChecking}
        onClick={onCheckout}
        fullWidth
        className="text-lg disabled:bg-surface-muted disabled:text-text-muted"
      >
        {isLicenseChecking ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking license...
          </span>
        ) : (
          "Proceed to Checkout"
        )}
      </ActionButton>
    </SurfaceCard>
  )
}
