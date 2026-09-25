"use client"

import DashboardPanel from "@/components/dashboard-shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "@/components/dashboard-shared/dashboardToneMaps"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useGeographicDistributionQuery } from "../hooks/useOverviewQueries"

const COLOR_PALETTE = [
  DOT_TONE_CLASS_MAP.info,
  DOT_TONE_CLASS_MAP.success,
  DOT_TONE_CLASS_MAP.warning,
  "bg-brand-strong",
  DOT_TONE_CLASS_MAP.neutral,
]

const RANGE_OPTIONS: { label: string; value: 7 | 30 | 90 | "all" }[] = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "All", value: "all" },
]

const SKELETON_ROW_IDS = ["row-1", "row-2", "row-3"] as const

const GeographicDistribution = () => {
  const { range, setRange, isLoading, fetchError, cities, growthMarkets, refetch } = useGeographicDistributionQuery()

  return (
    <DashboardPanel
      title="Geographic Distribution"
      action={RANGE_OPTIONS.map((option) => (
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
    >
      {isLoading ? (
        <div className="space-y-4">
          {SKELETON_ROW_IDS.map((id) => (
            <Skeleton key={id} className="h-6 rounded-full" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-medium text-danger">Couldn't load geographic distribution. Please try again.</p>
          <Button type="button" variant="outline" onClick={refetch} className="rounded-lg px-4">
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cities.map((city, index) => {
              const color = COLOR_PALETTE[index % COLOR_PALETTE.length]

              return (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${color} rounded-full mr-3`}></div>
                    <span className="text-sm font-medium text-text-primary">{city.city}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 h-2 w-20 rounded-full bg-surface-muted">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${city.percentage}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{Math.round(city.percentage)}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {growthMarkets.length > 0 ? (
            <div className="mt-6 rounded-xl border border-border-soft bg-surface-muted/70 p-4">
              <div className="mb-2 text-sm font-medium text-text-primary">Top Growth Markets</div>
              <div className="space-y-2">
                {growthMarkets.map((market) => (
                  <div key={market.city} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{market.city}</span>
                    <span className="font-medium text-success">
                      {(market.countChangePercentage ?? 0) > 0 ? "+" : ""}
                      {market.countChangePercentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </DashboardPanel>
  )
}

export default GeographicDistribution
