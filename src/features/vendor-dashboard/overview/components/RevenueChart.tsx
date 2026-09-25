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
import DashboardPanel from "@/components/dashboard-shared/DashboardPanel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getVendorChartOptions, getVendorChartPalette } from "@/features/vendor-dashboard/shared/lib/chartTheme"
import { useRevenueChartQuery } from "../hooks/useOverviewQueries"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const RevenueChart = () => {
  const sectionId = useId()
  const palette = useMemo(() => getVendorChartPalette(), [])
  const { range, setRange, isLoading, fetchError, labels, values, refetch } = useRevenueChartQuery()

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

  const base = getVendorChartOptions(palette)
  const options = {
    ...base,
    scales: {
      ...base.scales,
      y: { ...base.scales.y, title: { display: true, text: "Revenue ($)", color: palette.textSecondary } },
    },
  }

  return (
    <section id={sectionId} className="h-full">
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
            <Skeleton className="h-full w-full rounded-xl" />
          ) : fetchError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-danger">Couldn't load revenue. Please try again.</p>
              <Button type="button" variant="outline" onClick={refetch} className="rounded-lg px-4">
                Retry
              </Button>
            </div>
          ) : (
            // react-chartjs-2 forwards unknown props straight to the underlying <canvas role="img">,
            // which is otherwise nameless to assistive tech.
            <Line data={data} options={options} aria-label="Monthly revenue performance" />
          )}
        </div>
      </DashboardPanel>
    </section>
  )
}

export default RevenueChart
