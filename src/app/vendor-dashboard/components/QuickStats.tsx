import { RefreshCw } from "lucide-react"

const QuickStats = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Quick Stats</h2>
        <button type="button" className="text-steel-blue hover:text-opacity-80">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="text-center p-4 bg-linear-to-br from-steel-blue to-blue-700 rounded-xl text-white">
          <div className="text-2xl font-bold mb-1">$47,892</div>
          <div className="text-sm opacity-90">Monthly Revenue</div>
          <div className="text-xs opacity-75 mt-1">+12.5% from last month</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-light-mint-gray rounded-xl">
            <div className="text-lg font-bold text-steel-blue">342</div>
            <div className="text-xs text-gray-600">Orders</div>
          </div>
          <div className="text-center p-3 bg-light-mint-gray rounded-xl">
            <div className="text-lg font-bold text-steel-blue">1,247</div>
            <div className="text-xs text-gray-600">Customers</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-light-mint-gray rounded-xl">
            <div className="text-lg font-bold text-steel-blue">4.8</div>
            <div className="text-xs text-gray-600">Rating</div>
          </div>
          <div className="text-center p-3 bg-light-mint-gray rounded-xl">
            <div className="text-lg font-bold text-steel-blue">68%</div>
            <div className="text-xs text-gray-600">Conversion</div>
          </div>
        </div>

        <div className="p-4 bg-linear-to-r from-pale-lime to-green-200 rounded-xl">
          <div className="text-center">
            <div className="text-lg font-bold text-steel-blue mb-1">Top Performer</div>
            <div className="text-sm text-gray-700">You&apos;re in the top 5% of suppliers this month!</div>
            <button
              type="button"
              className="mt-2 bg-steel-blue text-white px-4 py-1 rounded-lg text-xs hover:bg-opacity-90"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickStats
