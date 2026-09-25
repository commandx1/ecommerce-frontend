import { DollarSign, type LucideIcon, ShoppingBag, Star } from "lucide-react"
import type { VendorRevenueSummary, VendorReviewSummary } from "@/lib/api/vendor-dashboard"
import formatCurrency from "@/lib/helpers/formatCurrency"

export interface MetricCard {
  id: string
  title: string
  value: string
  description: string
  footer?: string
  change?: string
  changeType?: "positive" | "negative"
  icon: LucideIcon
  iconColor: string
}

/** A malformed 200 body can send `null`/a non-number for a count field - falling through to
 * `String(null)` would literally print "null" to the vendor, so this floors to 0 instead. */
const formatCount = (value: number): string => (Number.isFinite(value) ? String(value) : "0")

export function buildMetricCards(
  revenueSummary: VendorRevenueSummary,
  reviewSummary: VendorReviewSummary,
  rangeDays: number,
): MetricCard[] {
  return [
    {
      id: "revenue",
      title: "Total Revenue",
      value: formatCurrency(revenueSummary.totalRevenue),
      description: `Last ${rangeDays} days`,
      footer: `${formatCurrency(revenueSummary.totalApprovedVendorPayment)} approved payout (${formatCount(revenueSummary.approvedVendorPaymentCount)})`,
      icon: DollarSign,
      iconColor: "green",
    },
    {
      id: "orders",
      title: "Orders",
      value: formatCount(revenueSummary.orderItemCount),
      description: `Last ${rangeDays} days`,
      icon: ShoppingBag,
      iconColor: "blue",
    },
    {
      id: "rating",
      title: "Rating",
      value:
        reviewSummary.currentReviewCount > 0 && Number.isFinite(reviewSummary.currentAverageRating)
          ? reviewSummary.currentAverageRating.toFixed(1)
          : "—",
      description: "Average rating",
      change: Number.isFinite(reviewSummary.ratingChangePercentage)
        ? `${(reviewSummary.ratingChangePercentage as number) > 0 ? "+" : ""}${reviewSummary.ratingChangePercentage}%`
        : undefined,
      changeType: (reviewSummary.ratingChangePercentage ?? 0) >= 0 ? "positive" : "negative",
      icon: Star,
      iconColor: "orange",
    },
  ]
}
