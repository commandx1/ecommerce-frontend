"use client"

import { useMemo } from "react"
import DashboardPanel from "@/components/dashboard-shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "@/components/dashboard-shared/dashboardToneMaps"
import { Button } from "@/components/ui/button"
import vendorCustomerAnalyticsData from "@/data/vendor-customer-analytics.json"
import LazyLineChart from "@/features/vendor-dashboard/shared/components/LazyLineChart"
import { getVendorChartOptions, getVendorChartPalette } from "@/features/vendor-dashboard/shared/lib/chartTheme"

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

  const base = getVendorChartOptions(palette)
  const options = {
    ...base,
    plugins: {
      ...base.plugins,
      legend: {
        display: true,
        position: "bottom" as const,
        align: "center" as const,
        labels: { color: palette.textSecondary },
      },
    },
    scales: {
      ...base.scales,
      y: { ...base.scales.y, title: { display: true, text: "Customers", color: palette.textSecondary } },
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
        {/* aria-label reaches the underlying <canvas role="img">, which react-chartjs-2 renders nameless otherwise. */}
        <LazyLineChart data={data} options={options} aria-label="New and returning customers over time" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
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
