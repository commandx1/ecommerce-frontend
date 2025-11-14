import { Box, CheckCircle, Clock, type LucideIcon, Truck } from "lucide-react"
import Link from "next/link"
import dashboardOrdersData from "@/data/dashboard-orders.json"

const iconMap: Record<string, LucideIcon> = {
  box: Box,
  truck: Truck,
  clock: Clock,
  "check-circle": CheckCircle,
}

const statusColorMap: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  "coral-orange": "bg-coral-orange/20 text-coral-orange",
}

const RecentOrders = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-steel-blue">Recent Orders</h2>
          <Link href="/orders" className="text-steel-blue hover:underline font-medium">
            View All
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardOrdersData.recentOrders.map((order) => {
            const IconComponent = iconMap[order.icon]
            const statusColorClass = statusColorMap[order.statusColor] || "bg-gray-100 text-gray-700"

            return (
              <div key={order.id} className="flex items-center justify-between p-4 bg-light-mint-gray rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    {IconComponent && (
                      <IconComponent
                        className={`text-steel-blue ${order.statusColor === "blue" ? "text-blue-600" : order.statusColor === "green" ? "text-green-600" : "text-coral-orange"} w-5 h-5`}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-blue">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      {order.supplier} • {order.date}
                    </p>
                    <p className="text-sm text-gray-500">{order.items}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-steel-blue">{order.amount}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`${statusColorClass} text-xs px-2 py-1 rounded-full`}>{order.status}</span>
                    <button type="button" className="text-steel-blue hover:underline text-sm">
                      {order.action}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RecentOrders
