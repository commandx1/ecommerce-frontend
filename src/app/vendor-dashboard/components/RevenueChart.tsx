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
import { useEffect, useId, useMemo, useRef, useState } from "react"
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
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!isAuthenticated) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setIsLoading(true)
        const response = await vendorDashboardAPI.getPeriodicRevenue(
          range === "all" ? undefined : { months: range },
          controller.signal,
        )
        setLabels(response.periods.map((period) => period.period))
        setValues(response.periods.map((period) => period.totalRevenue))
      } catch {
        if (controller.signal.aborted) return
        setLabels([])
        setValues([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchRevenue()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isAuthenticated, range])

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
          ) : (
            <Line data={data} options={options} />
          )}
        </div>
      </DashboardPanel>
    </section>
  )
}

export default RevenueChart
