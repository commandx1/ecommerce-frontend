import { Box, CheckCircle, Clock, type LucideIcon, Truck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import dashboardOrdersData from "@/data/dashboard-orders.json"

const iconMap: Record<string, LucideIcon> = {
  box: Box,
  truck: Truck,
  clock: Clock,
  "check-circle": CheckCircle,
}

const statusColorMap: Record<string, string> = {
  green: "bg-success/15 text-success",
  blue: "bg-brand/15 text-brand",
  "coral-orange": "bg-coral-orange/20 text-coral-orange",
}

const RecentOrders = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Recent Orders</h2>
          <Link href="/orders" className="font-medium text-brand hover:underline">
            View All
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardOrdersData.recentOrders.map((order) => {
            const IconComponent = iconMap[order.icon]
            const statusColorClass = statusColorMap[order.statusColor] || "bg-surface-muted text-text-secondary"
            const iconToneClass =
              order.statusColor === "blue"
                ? "text-brand"
                : order.statusColor === "green"
                  ? "text-success"
                  : "text-coral-orange"

            return (
              <div key={order.id} className="flex items-center justify-between rounded-lg bg-surface-muted/55 p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-elevated">
                    {IconComponent && <IconComponent className={`h-5 w-5 ${iconToneClass}`} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Order #{order.id}</h3>
                    <p className="text-sm text-text-secondary">
                      {order.supplier} • {order.date}
                    </p>
                    <p className="text-sm text-text-muted">{order.items}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-text-primary">{order.amount}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`${statusColorClass} text-xs px-2 py-1 rounded-full`}>{order.status}</span>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm">
                      {order.action}
                    </Button>
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
