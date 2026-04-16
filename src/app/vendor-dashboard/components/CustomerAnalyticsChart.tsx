"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { useMemo } from "react"
import { Line } from "react-chartjs-2"
import { Button } from "@/components/ui/button"
import vendorCustomerAnalyticsData from "@/data/vendor-customer-analytics.json"
import { getVendorChartPalette } from "./shared/chartTheme"
import DashboardPanel from "./shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CustomerAnalyticsChart = () => {
  const palette = useMemo(() => getVendorChartPalette(), [])

  const data = {
    labels: vendorCustomerAnalyticsData.chartData.categories,
    datasets: [
      {
        label: "New Customers",
        data: vendorCustomerAnalyticsData.chartData.newCustomers,
        borderColor: palette.brand,
        backgroundColor: "rgba(62, 108, 136, 0.22)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Returning Customers",
        data: vendorCustomerAnalyticsData.chartData.returningCustomers,
        borderColor: palette.success,
        backgroundColor: "rgba(79, 169, 122, 0.22)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        align: "center" as const,
        labels: {
          color: palette.textSecondary,
        },
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
          text: "Customers",
          color: palette.textSecondary,
        },
      },
    },
  }

  return (
    <DashboardPanel
      title="Customer Analytics"
      className="lg:col-span-2"
      action={
        <div className="flex items-center space-x-2">
          <Button type="button" variant="quiet" size="sm" className="rounded-lg border border-border-soft px-3">
            Week
          </Button>
          <Button type="button" variant="default" size="sm" className="rounded-lg px-3">
            Month
          </Button>
          <Button type="button" variant="quiet" size="sm" className="rounded-lg border border-border-soft px-3">
            Year
          </Button>
        </div>
      }
    >
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
      <div className="grid grid-cols-4 gap-4 mt-6">
        {vendorCustomerAnalyticsData.stats.map((stat) => (
          <div key={stat.id} className="rounded-xl border border-border-soft bg-surface-muted/70 p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-secondary">{stat.label}</div>
            <div
              className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${STATUS_TONE_CLASS_MAP.success}`}
            >
              {stat.description}
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  )
}

export default CustomerAnalyticsChart
