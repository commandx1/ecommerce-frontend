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
import dashboardChartData from "@/data/dashboard-chart.json"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const SpendingChart = () => {
  const data = {
    labels: dashboardChartData.spendingChart.categories,
    datasets: [
      {
        label: "Monthly Spending",
        data: dashboardChartData.spendingChart.data,
        borderColor: dashboardChartData.spendingChart.color,
        backgroundColor: `${dashboardChartData.spendingChart.color}20`,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: dashboardChartData.spendingChart.color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        tension: 0.1,
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
        backgroundColor: "#1F2937",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        callbacks: {
          label(tooltipItem) {
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
          color: "#6B7280",
        },
      },
      y: {
        title: {
          display: true,
          text: "Amount ($)",
          color: "#6B7280",
        },
        grid: {
          color: "#F3F4F6",
        },
        ticks: {
          color: "#6B7280",
          callback(value: number | string) {
            return `$${Number(value) / 1000}k`
          },
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-steel-blue">Monthly Spending</h2>
          <div className="flex space-x-2">
            <button type="button" className="text-steel-blue text-sm hover:underline">
              6M
            </button>
            <button type="button" className="text-gray-500 text-sm hover:underline">
              1Y
            </button>
            <button type="button" className="text-gray-500 text-sm hover:underline">
              All
            </button>
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
