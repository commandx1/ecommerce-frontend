import { Loader2, Repeat } from "lucide-react"
import Link from "next/link"
import NotificationCard from "@/components/feedback/NotificationCard"
import ActionButton from "@/components/ui/ActionButton"
import SurfaceCard from "@/components/ui/SurfaceCard"
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
    { label: `Subtotal (${itemsCount} items)`, value: formatCurrency(totals.subtotal) },
    { label: "Shipment fee", value: totals.shipmentFee === 0 ? "Free" : formatCurrency(totals.shipmentFee) },
    ...(totals.heavyShipmentFee > 0
      ? [{ label: "Heavy shipment fee", value: formatCurrency(totals.heavyShipmentFee) }]
      : []),
    { label: "Estimated Tax", value: taxValue, isLoading: isTaxLoading },
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
        licenseCheckFailed ? (
          // The licence service itself failed, so we do not know whether this buyer has one.
          // Checkout stays blocked (fail-closed), but pointing an already-licensed buyer at the
          // settings page would send them somewhere that looks correct and explains nothing.
          <NotificationCard
            tone="warning"
            title="Couldn't verify your dental license"
            description="One or more items in your cart require an approved dental license, and we couldn't check yours just now. Please try again in a moment."
            className="mb-4 rounded-lg px-3 py-2"
          />
        ) : licenseStatus === "pending" ? (
          <NotificationCard
            tone="warning"
            title="License awaiting approval"
            description="One or more items in your cart require an approved dental license. Yours is under review — checkout unlocks as soon as it's approved."
            className="mb-4 rounded-lg px-3 py-2"
          >
            <Link
              href="/buyer-dashboard/settings"
              className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              View your license
            </Link>
          </NotificationCard>
        ) : licenseStatus === "expired" ? (
          <NotificationCard
            tone="warning"
            title="Your dental license expired"
            description="One or more items in your cart require a valid dental license. Renew yours to continue."
            className="mb-4 rounded-lg px-3 py-2"
          >
            <Link
              href="/buyer-dashboard/settings"
              className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              Renew your license
            </Link>
          </NotificationCard>
        ) : licenseStatus === "rejected" ? (
          <NotificationCard
            tone="warning"
            title="Your dental license wasn't approved"
            description="One or more items in your cart require an approved dental license."
            className="mb-4 rounded-lg px-3 py-2"
          >
            {/* Admin-authored free text: rendered as plain text, never as HTML. */}
            {licenseRejectionReason ? (
              <p className="mt-1 text-sm text-text-secondary">Reason: {licenseRejectionReason}</p>
            ) : null}
            <Link
              href="/buyer-dashboard/settings"
              className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              Update your license
            </Link>
          </NotificationCard>
        ) : (
          // "missing" (no license on file at all).
          <NotificationCard
            tone="warning"
            title="Dental license required"
            description="One or more items in your cart require a valid, approved dental license."
            className="mb-4 rounded-lg px-3 py-2"
          >
            <Link
              href="/buyer-dashboard/settings"
              className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              Add your license
            </Link>
          </NotificationCard>
        )
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
