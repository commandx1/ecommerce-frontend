import vendorRecentOrdersData from "@/data/vendor-recent-orders.json"
import DashboardPanel from "./shared/DashboardPanel"

const statusColorMap: Record<string, { bg: string; text: string }> = {
  green: {
    bg: "bg-success/14",
    text: "text-success",
  },
  blue: {
    bg: "bg-brand/14",
    text: "text-brand",
  },
  yellow: {
    bg: "bg-warning/14",
    text: "text-warning",
  },
}

const VendorRecentOrders = () => {
  return (
    <DashboardPanel
      title="Recent Orders"
      action={
        <button type="button" className="text-sm text-brand transition-colors hover:text-brand-strong">
          View All Orders
        </button>
      }
    >
      <div className="space-y-4">
        {vendorRecentOrdersData.orders.map((order) => {
          const statusColors = statusColorMap[order.statusColor]

          return (
            <div key={order.id} className="flex items-center justify-between rounded-xl border border-border-soft p-4">
              <div className="flex items-center">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-primary-foreground">
                  <span className="text-sm font-semibold">{order.customerInitials}</span>
                </div>
                <div>
                  <div className="font-medium text-text-primary">{order.customer}</div>
                  <div className="text-sm text-text-secondary">Order {order.orderNumber}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-text-primary">{order.amount}</div>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusColors.bg} ${statusColors.text}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-xs text-text-secondary">
        24h success rate is stable, and order completion trend remains positive.
      </div>
    </DashboardPanel>
  )
}

export default VendorRecentOrders
