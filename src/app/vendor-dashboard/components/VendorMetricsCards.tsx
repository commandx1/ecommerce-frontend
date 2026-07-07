"use client"

import { DollarSign, type LucideIcon, ShoppingBag, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { vendorDashboardAPI } from "@/lib/api/vendor-dashboard"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { RING_TONE_CLASS_MAP, STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

interface MetricCard {
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

const colorMap: Record<string, string> = {
  green: RING_TONE_CLASS_MAP.success,
  blue: RING_TONE_CLASS_MAP.info,
  orange: RING_TONE_CLASS_MAP.warning,
}

type RangeOption = 7 | 30 | 90

const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
]

const VendorMetricsCards = () => {
  const { isAuthenticated } = useAuthStore()
  const [range, setRange] = useState<RangeOption>(30)
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!isAuthenticated) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setIsLoading(true)
        const [revenueSummary, reviewSummary] = await Promise.all([
          vendorDashboardAPI.getRevenueSummary(range, controller.signal),
          vendorDashboardAPI.getReviewSummary(controller.signal),
        ])

        const nextMetrics: MetricCard[] = [
          {
            id: "revenue",
            title: "Total Revenue",
            value: formatCurrency(revenueSummary.totalRevenue),
            description: `Last ${range} days`,
            footer: `${formatCurrency(revenueSummary.totalApprovedVendorPayment)} approved payout (${revenueSummary.approvedVendorPaymentCount})`,
            icon: DollarSign,
            iconColor: "green",
          },
          {
            id: "orders",
            title: "Orders",
            value: String(revenueSummary.orderItemCount),
            description: `Last ${range} days`,
            icon: ShoppingBag,
            iconColor: "blue",
          },
          {
            id: "rating",
            title: "Rating",
            value: reviewSummary.currentReviewCount > 0 ? reviewSummary.currentAverageRating.toFixed(1) : "—",
            description: "Average rating",
            change:
              reviewSummary.ratingChangePercentage !== null
                ? `${reviewSummary.ratingChangePercentage > 0 ? "+" : ""}${reviewSummary.ratingChangePercentage}%`
                : undefined,
            changeType: (reviewSummary.ratingChangePercentage ?? 0) >= 0 ? "positive" : "negative",
            icon: Star,
            iconColor: "orange",
          },
        ]

        setMetrics(nextMetrics)
      } catch {
        if (controller.signal.aborted) return
        setMetrics([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchMetrics()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isAuthenticated, range])

  const rangeSelector = (
    <div className="mb-4 flex items-center justify-end gap-2">
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.label}
          type="button"
          variant={range === option.value ? "default" : "quiet"}
          size="sm"
          className="rounded-lg border border-border-soft px-3"
          onClick={() => setRange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <>
        {rangeSelector}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((placeholder) => (
            <div
              key={placeholder}
              className="mb-6 h-40 animate-pulse rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
            />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      {rangeSelector}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon
          const iconColorClass = colorMap[metric.iconColor] ?? RING_TONE_CLASS_MAP.neutral
          const changeToneClass =
            metric.changeType === "positive" ? STATUS_TONE_CLASS_MAP.success : STATUS_TONE_CLASS_MAP.warning

          return (
            <div
              key={metric.id}
              className="mb-6 rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", iconColorClass)}>
                  <IconComponent className="text-xl w-6 h-6" />
                </div>
                {metric.change ? (
                  <span className={cn("rounded-full border px-2 py-1 text-sm font-medium", changeToneClass)}>
                    {metric.change}
                  </span>
                ) : null}
              </div>
              <div className="mb-1 text-2xl font-bold text-text-primary">{metric.value}</div>
              <div className="text-sm text-text-secondary">{metric.title}</div>
              <div className="mt-2 text-xs text-text-muted">{metric.description}</div>
              {metric.footer ? (
                <div className="mt-2 border-t border-border-soft pt-2 text-xs text-text-muted">{metric.footer}</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default VendorMetricsCards
