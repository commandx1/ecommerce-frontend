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
import { Line } from "react-chartjs-2"
import vendorCustomerAnalyticsData from "@/data/vendor-customer-analytics.json"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CustomerAnalyticsChart = () => {
  const data = {
    labels: vendorCustomerAnalyticsData.chartData.categories,
    datasets: [
      {
        label: "New Customers",
        data: vendorCustomerAnalyticsData.chartData.newCustomers,
        borderColor: "#3E6C88",
        backgroundColor: "rgba(62, 108, 136, 0.3)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Returning Customers",
        data: vendorCustomerAnalyticsData.chartData.returningCustomers,
        borderColor: "#D4ED6A",
        backgroundColor: "rgba(212, 237, 106, 0.3)",
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
          text: "Customers",
          color: "#6b7280",
        },
      },
    },
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Customer Analytics</h2>
        <div className="flex items-center space-x-2">
          <button type="button" className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Week
          </button>
          <button type="button" className="px-3 py-1 text-sm bg-steel-blue text-white rounded-lg">
            Month
          </button>
          <button type="button" className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Year
          </button>
        </div>
      </div>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
      <div className="grid grid-cols-4 gap-4 mt-6">
        {vendorCustomerAnalyticsData.stats.map((stat) => (
          <div key={stat.id} className="text-center p-4 bg-light-mint-gray rounded-xl">
            <div className="text-2xl font-bold text-steel-blue">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-xs text-green-600 mt-1">{stat.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CustomerAnalyticsChart
