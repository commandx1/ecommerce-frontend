import vendorRecentOrdersData from "@/data/vendor-recent-orders.json"

const statusColorMap: Record<string, { bg: string; text: string }> = {
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
}

const VendorRecentOrders = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Recent Orders</h2>
        <button type="button" className="text-steel-blue hover:text-opacity-80 text-sm">
          View All Orders
        </button>
      </div>
      <div className="space-y-4">
        {vendorRecentOrdersData.orders.map((order) => {
          const statusColors = statusColorMap[order.statusColor]

          return (
            <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-steel-blue rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-semibold">{order.customerInitials}</span>
                </div>
                <div>
                  <div className="font-medium text-steel-blue">{order.customer}</div>
                  <div className="text-sm text-gray-600">Order {order.orderNumber}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-steel-blue">{order.amount}</div>
                <span className={`text-xs ${statusColors.bg} ${statusColors.text} px-2 py-1 rounded-full`}>
                  {order.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VendorRecentOrders
