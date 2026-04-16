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
import { useId, useMemo } from "react"
import { Line } from "react-chartjs-2"
import { Button } from "@/components/ui/button"
import vendorChartsData from "@/data/vendor-charts.json"
import { getVendorChartPalette } from "./shared/chartTheme"
import DashboardPanel from "./shared/DashboardPanel"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const RevenueChart = () => {
  const sectionId = useId()
  const palette = useMemo(() => getVendorChartPalette(), [])

  const data = {
    labels: vendorChartsData.revenue.categories,
    datasets: [
      {
        label: "Revenue",
        data: vendorChartsData.revenue.data,
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
        description="Monthly revenue performance over the past 12 months"
        action={
          <div className="flex items-center space-x-2">
            <Button type="button" variant="quiet" size="sm" className="rounded-lg border border-border-soft px-3">
              6M
            </Button>
            <Button type="button" variant="default" size="sm" className="rounded-lg px-3">
              12M
            </Button>
            <Button type="button" variant="quiet" size="sm" className="rounded-lg border border-border-soft px-3">
              All
            </Button>
          </div>
        }
      >
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
      </DashboardPanel>
    </section>
  )
}

export default RevenueChart
