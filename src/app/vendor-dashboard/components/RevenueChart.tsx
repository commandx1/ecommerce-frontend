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
import { Line } from "react-chartjs-2"
import vendorChartsData from "@/data/vendor-charts.json"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const RevenueChart = () => {
  const data = {
    labels: vendorChartsData.revenue.categories,
    datasets: [
      {
        label: "Revenue",
        data: vendorChartsData.revenue.data,
        borderColor: vendorChartsData.revenue.color,
        backgroundColor: "transparent",
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: vendorChartsData.revenue.color,
        pointBorderColor: "#ffffff",
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
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        titleColor: "#374151",
        bodyColor: "#374151",
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          color: "#e5e7eb",
        },
      },
      y: {
        grid: {
          color: "#f3f4f6",
        },
        border: {
          color: "#e5e7eb",
        },
        ticks: {
          color: "#6b7280",
        },
        title: {
          display: true,
          text: "Revenue ($)",
          color: "#6b7280",
        },
      },
    },
  }

  return (
    <section id="revenue-chart-section" className="mb-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-steel-blue">Revenue Analytics</h2>
            <p className="text-gray-600 text-sm">Monthly revenue performance over the past 12 months</p>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              6M
            </button>
            <button type="button" className="px-3 py-1 text-sm bg-steel-blue text-white rounded-lg">
              12M
            </button>
            <button type="button" className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              All
            </button>
          </div>
        </div>
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
      </div>
    </section>
  )
}

export default RevenueChart
