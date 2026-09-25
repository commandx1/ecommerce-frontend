"use client"

import { RING_TONE_CLASS_MAP, STATUS_TONE_CLASS_MAP } from "@/components/dashboard-shared/dashboardToneMaps"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useVendorMetricsQuery } from "../hooks/useOverviewQueries"

const colorMap: Record<string, string> = {
  green: RING_TONE_CLASS_MAP.success,
  blue: RING_TONE_CLASS_MAP.info,
  orange: RING_TONE_CLASS_MAP.warning,
}

const RANGE_OPTIONS: { label: string; value: 7 | 30 | 90 }[] = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
]

const SKELETON_CARD_IDS = ["card-1", "card-2", "card-3"] as const

const VendorMetricsCards = () => {
  const { range, setRange, isLoading, fetchError, metrics, refetch } = useVendorMetricsQuery()

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
        <div aria-busy="true" className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <span className="sr-only">Loading metrics</span>
          {/* Keeps the real card's glass shell and mirrors its contents - icon tile, change pill,
              value, title, description - so the shell never pops in and the text lines land where
              the placeholders were. The previous version pulsed an empty card, which meant the
              whole metric block re-laid-out the moment data arrived. */}
          {SKELETON_CARD_IDS.map((id) => (
            <SurfaceCard key={id} variant="glass" className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
              <Skeleton className="mb-1 h-8 w-28" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-4 w-44" />
            </SurfaceCard>
          ))}
        </div>
      </>
    )
  }

  if (fetchError) {
    return (
      <>
        {rangeSelector}
        <SurfaceCard
          variant="glass"
          className="mb-6 flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
        >
          <p className="text-sm font-medium text-danger">Couldn't load your metrics. Please try again.</p>
          <Button type="button" variant="outline" onClick={refetch} className="rounded-lg px-4">
            Retry
          </Button>
        </SurfaceCard>
      </>
    )
  }

  return (
    <>
      {rangeSelector}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon
          const iconColorClass = colorMap[metric.iconColor] ?? RING_TONE_CLASS_MAP.neutral
          const changeToneClass =
            metric.changeType === "positive" ? STATUS_TONE_CLASS_MAP.success : STATUS_TONE_CLASS_MAP.warning

          return (
            <SurfaceCard key={metric.id} variant="glass" className="p-6">
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
            </SurfaceCard>
          )
        })}
      </div>
    </>
  )
}

export default VendorMetricsCards
