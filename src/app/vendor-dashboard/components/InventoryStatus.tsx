import { Button } from "@/components/ui/button"
import vendorInventoryData from "@/data/vendor-inventory.json"
import DashboardPanel from "./shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  green: {
    bg: "bg-success/10",
    border: "border-success/20",
    text: "text-success",
    dot: DOT_TONE_CLASS_MAP.success,
  },
  yellow: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    text: "text-warning",
    dot: DOT_TONE_CLASS_MAP.warning,
  },
  red: {
    bg: "bg-danger/10",
    border: "border-danger/20",
    text: "text-danger",
    dot: DOT_TONE_CLASS_MAP.danger,
  },
}

const statusColorMap: Record<string, string> = {
  critical: "text-danger",
  warning: "text-warning",
}

const InventoryStatus = () => {
  return (
    <DashboardPanel
      title="Inventory Status"
      action={
        <Button type="button" size="sm" className="rounded-lg px-3">
          Manage Inventory
        </Button>
      }
    >
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
                  <div className="font-medium text-text-primary">{item.status}</div>
                  <div className="text-sm text-text-secondary">{item.count} products</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${colors.text}`}>{item.percentage}%</div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-text-primary">Critical Stock Alerts</h3>
        <div className="space-y-2">
          {vendorInventoryData.alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-muted/70 px-3 py-2 text-sm"
            >
              <span className="text-text-secondary">{alert.product}</span>
              <span className={`${statusColorMap[alert.status]} font-medium`}>{alert.stock} left</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardPanel>
  )
}

export default InventoryStatus
