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
  type TooltipItem,
} from "chart.js"
import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import { Button } from "@/components/ui/button"
import dashboardChartData from "@/data/dashboard-chart.json"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const SpendingChart = () => {
  const [palette, setPalette] = useState({
    brand: "#3B82F6",
    textPrimary: "#111827",
    textMuted: "#6B7280",
    borderSoft: "#E5E7EB",
    surfaceElevated: "#FFFFFF",
  })

  useEffect(() => {
    const syncPalette = () => {
      const styles = getComputedStyle(document.documentElement)
      const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback

      setPalette({
        brand: read("--brand", "#3B82F6"),
        textPrimary: read("--text-primary", "#111827"),
        textMuted: read("--text-muted", "#6B7280"),
        borderSoft: read("--border-soft", "#E5E7EB"),
        surfaceElevated: read("--surface-elevated", "#FFFFFF"),
      })
    }

    syncPalette()

    const observer = new MutationObserver(syncPalette)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    return () => observer.disconnect()
  }, [])

  const data = {
    labels: dashboardChartData.spendingChart.categories,
    datasets: [
      {
        label: "Monthly Spending",
        data: dashboardChartData.spendingChart.data,
        borderColor: palette.brand,
        backgroundColor: palette.brand,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: palette.brand,
        pointBorderColor: palette.surfaceElevated,
        pointBorderWidth: 2,
        tension: 0.2,
      },
    ],
  }

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: palette.surfaceElevated,
          borderColor: palette.borderSoft,
          borderWidth: 1,
          padding: 12,
          titleColor: palette.textPrimary,
          bodyColor: palette.textPrimary,
          callbacks: {
            label(tooltipItem: TooltipItem<"line">) {
              const value = tooltipItem.parsed.y
              if (value === null || value === undefined) return ""
              return `$${value.toLocaleString()}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: palette.textMuted,
          },
        },
        y: {
          title: {
            display: true,
            text: "Amount ($)",
            color: palette.textMuted,
          },
          grid: {
            color: palette.borderSoft,
          },
          ticks: {
            color: palette.textMuted,
            callback(value: number | string) {
              return `$${Number(value) / 1000}k`
            },
          },
        },
      },
    }),
    [palette],
  )

  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Monthly Spending</h2>
          <div className="flex space-x-2">
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm">
              6M
            </Button>
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm text-text-muted">
              1Y
            </Button>
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm text-text-muted">
              All
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="h-64">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  )
}

export default SpendingChart
