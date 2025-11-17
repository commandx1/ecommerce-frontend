"use client"

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from "chart.js"
import { Bar } from "react-chartjs-2"
import vendorChartsData from "@/data/vendor-charts.json"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const SalesPerformanceChart = () => {
  const data = {
    labels: vendorChartsData.salesPerformance.categories,
    datasets: [
      {
        label: "Sales",
        data: vendorChartsData.salesPerformance.sales,
        backgroundColor: vendorChartsData.salesPerformance.salesColor,
      },
      {
        label: "Target",
        data: vendorChartsData.salesPerformance.target,
        backgroundColor: vendorChartsData.salesPerformance.targetColor,
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
          text: "Sales",
          color: "#6b7280",
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Sales Performance</h2>
        <button type="button" className="text-steel-blue hover:text-opacity-80" aria-label="More options">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <title>More options</title>
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-steel-blue">{vendorChartsData.performance.conversionRate}</div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-steel-blue">{vendorChartsData.performance.avgOrderValue}</div>
          <div className="text-sm text-gray-600">Avg. Order Value</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-steel-blue">{vendorChartsData.performance.ordersPerCustomer}</div>
          <div className="text-sm text-gray-600">Orders per Customer</div>
        </div>
      </div>
    </div>
  )
}

export default SalesPerformanceChart
