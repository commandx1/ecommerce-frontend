"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { Line } from "react-chartjs-2"
import { Button } from "@/components/ui/button"
import { vendorDashboardAPI } from "@/lib/api/vendor-dashboard"
import { useAuthStore } from "@/stores/authStore"
import { getVendorChartPalette } from "./shared/chartTheme"
import DashboardPanel from "./shared/DashboardPanel"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

type RevenueRange = 6 | 12 | "all"

const RevenueChart = () => {
  const sectionId = useId()
  const palette = useMemo(() => getVendorChartPalette(), [])
  const { isAuthenticated } = useAuthStore()
  const [range, setRange] = useState<RevenueRange>(12)
  const [labels, setLabels] = useState<string[]>([])
  const [values, setValues] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchRevenue = useCallback(async () => {
    if (!isAuthenticated) return

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setIsLoading(true)
      setFetchError(false)
      const response = await vendorDashboardAPI.getPeriodicRevenue(
        range === "all" ? undefined : { months: range },
        controller.signal,
      )
      // Guard against a malformed 200 body — `periods` missing, null, or not an array would
      // otherwise throw on `.map` and blank the whole dashboard (infra note #26).
      const periods = Array.isArray(response.periods) ? response.periods : []
      setLabels(periods.map((period) => period.period))
      setValues(periods.map((period) => period.totalRevenue))
    } catch {
      if (controller.signal.aborted) return
      setLabels([])
      setValues([])
      setFetchError(true)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated, range])

  useEffect(() => {
    void fetchRevenue()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchRevenue])

  const data = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: values,
        borderColor: palette.brand,
        backgroundColor: "transparent",
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: palette.brand,
        pointBorderColor: palette.surfaceMuted,
        pointBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: palette.surfaceMuted,
        borderColor: palette.borderSoft,
        borderWidth: 1,
        titleColor: palette.textPrimary,
        bodyColor: palette.textPrimary,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          color: palette.borderSoft,
        },
        ticks: { color: palette.textSecondary },
      },
      y: {
        grid: {
          color: palette.surfaceMuted,
        },
        border: {
          color: palette.borderSoft,
        },
        ticks: {
          color: palette.textSecondary,
        },
        title: {
          display: true,
          text: "Revenue ($)",
          color: palette.textSecondary,
        },
      },
    },
  }

  return (
    <section id={sectionId} className="mb-8">
      <DashboardPanel
        title="Revenue Analytics"
        description="Monthly revenue performance"
        action={
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={range === 6 ? "default" : "quiet"}
              size="sm"
              className="rounded-lg border border-border-soft px-3"
              onClick={() => setRange(6)}
            >
              6M
            </Button>
            <Button
              type="button"
              variant={range === 12 ? "default" : "quiet"}
              size="sm"
              className="rounded-lg px-3"
              onClick={() => setRange(12)}
            >
              12M
            </Button>
            <Button
              type="button"
              variant={range === "all" ? "default" : "quiet"}
              size="sm"
              className="rounded-lg border border-border-soft px-3"
              onClick={() => setRange("all")}
            >
              All
            </Button>
          </div>
        }
      >
        <div className="h-80">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-surface-muted" />
          ) : fetchError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-danger">Couldn't load revenue. Please try again.</p>
              <Button type="button" variant="outline" onClick={() => void fetchRevenue()} className="rounded-lg px-4">
                Retry
              </Button>
            </div>
          ) : (
            <Line data={data} options={options} />
          )}
        </div>
      </DashboardPanel>
    </section>
  )
}

export default RevenueChart
