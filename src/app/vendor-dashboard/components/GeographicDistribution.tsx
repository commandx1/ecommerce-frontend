"use client"

import { Expand } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { type VendorGeographicDistributionResponse, vendorDashboardAPI } from "@/lib/api/vendor-dashboard"
import { useAuthStore } from "@/stores/authStore"
import DashboardPanel from "./shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const COLOR_PALETTE = [
  DOT_TONE_CLASS_MAP.info,
  DOT_TONE_CLASS_MAP.success,
  DOT_TONE_CLASS_MAP.warning,
  "bg-brand-strong",
  DOT_TONE_CLASS_MAP.neutral,
]

type RangeOption = 7 | 30 | 90 | "all"

const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "All", value: "all" },
]

const GeographicDistribution = () => {
  const { isAuthenticated } = useAuthStore()
  const [range, setRange] = useState<RangeOption>(30)
  const [distribution, setDistribution] = useState<VendorGeographicDistributionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchDistribution = async () => {
      if (!isAuthenticated) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setIsLoading(true)
        const response = await vendorDashboardAPI.getGeographicDistribution(
          range === "all" ? undefined : range,
          controller.signal,
        )
        setDistribution(response)
      } catch {
        if (controller.signal.aborted) return
        setDistribution(null)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchDistribution()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isAuthenticated, range])

  const growthMarkets = useMemo(() => {
    if (!distribution) return []

    return distribution.cities
      .filter((city) => city.countChangePercentage !== null)
      .sort((a, b) => (b.countChangePercentage ?? 0) - (a.countChangePercentage ?? 0))
      .slice(0, 3)
  }, [distribution])

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
          {[0, 1, 2].map((placeholder) => (
            <div key={placeholder} className="h-6 animate-pulse rounded-full bg-surface-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {(distribution?.cities ?? []).map((city, index) => {
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
