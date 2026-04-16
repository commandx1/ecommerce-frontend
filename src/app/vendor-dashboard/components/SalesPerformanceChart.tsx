"use client"

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from "chart.js"
import { MoreVertical } from "lucide-react"
import { useMemo } from "react"
import { Bar } from "react-chartjs-2"
import vendorChartsData from "@/data/vendor-charts.json"
import { getVendorChartPalette } from "./shared/chartTheme"
import DashboardPanel from "./shared/DashboardPanel"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const SalesPerformanceChart = () => {
  const palette = useMemo(() => getVendorChartPalette(), [])

  const data = {
    labels: vendorChartsData.salesPerformance.categories,
    datasets: [
      {
        label: "Sales",
        data: vendorChartsData.salesPerformance.sales,
        backgroundColor: palette.brand,
      },
      {
        label: "Target",
        data: vendorChartsData.salesPerformance.target,
        backgroundColor: palette.warning,
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
          text: "Sales",
          color: palette.textSecondary,
        },
      },
    },
  }

  return (
    <DashboardPanel
      title="Sales Performance"
      action={
        <button type="button" className="text-text-muted transition-colors hover:text-brand" aria-label="More options">
          <MoreVertical className="h-5 w-5" />
        </button>
      }
    >
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{vendorChartsData.performance.conversionRate}</div>
          <div className="text-sm text-text-secondary">Conversion Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{vendorChartsData.performance.avgOrderValue}</div>
          <div className="text-sm text-text-secondary">Avg. Order Value</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{vendorChartsData.performance.ordersPerCustomer}</div>
          <div className="text-sm text-text-secondary">Orders per Customer</div>
        </div>
      </div>
    </DashboardPanel>
  )
}

export default SalesPerformanceChart
