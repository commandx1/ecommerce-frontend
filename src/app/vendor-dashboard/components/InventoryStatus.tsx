import vendorInventoryData from "@/data/vendor-inventory.json"

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-600",
    dot: "bg-green-500",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-600",
    dot: "bg-yellow-500",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    dot: "bg-red-500",
  },
}

const statusColorMap: Record<string, string> = {
  critical: "text-red-600",
  warning: "text-yellow-600",
}

const InventoryStatus = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Inventory Status</h2>
        <button type="button" className="bg-steel-blue text-white px-3 py-1 rounded-lg text-sm hover:bg-opacity-90">
          Manage Inventory
        </button>
      </div>
      <div className="space-y-4">
        {vendorInventoryData.status.map((item) => {
          const colors = colorMap[item.color]

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 ${colors.bg} rounded-xl border ${colors.border}`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 ${colors.dot} rounded-full mr-3`}></div>
                <div>
                  <div className="font-medium text-steel-blue">{item.status}</div>
                  <div className="text-sm text-gray-600">{item.count} products</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${colors.text}`}>{item.percentage}%</div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-steel-blue mb-3">Critical Stock Alerts</h3>
        <div className="space-y-2">
          {vendorInventoryData.alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{alert.product}</span>
              <span className={`${statusColorMap[alert.status]} font-medium`}>{alert.stock} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InventoryStatus
