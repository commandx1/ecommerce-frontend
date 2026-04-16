import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardPanel from "./shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const QuickStats = () => {
  return (
    <DashboardPanel
      title="Quick Stats"
      action={
        <button type="button" className="text-text-muted transition-colors hover:text-brand">
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl bg-linear-to-br from-brand to-brand-strong p-4 text-center text-primary-foreground">
          <div className="text-2xl font-bold mb-1">$47,892</div>
          <div className="text-sm opacity-90">Monthly Revenue</div>
          <div className="text-xs opacity-75 mt-1">+12.5% from last month</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-center">
            <div className="text-lg font-bold text-text-primary">342</div>
            <div className="text-xs text-text-secondary">Orders</div>
          </div>
          <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-center">
            <div className="text-lg font-bold text-text-primary">1,247</div>
            <div className="text-xs text-text-secondary">Customers</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-center">
            <div className="text-lg font-bold text-text-primary">4.8</div>
            <div className="text-xs text-text-secondary">Rating</div>
          </div>
          <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-center">
            <div className="text-lg font-bold text-text-primary">68%</div>
            <div className="text-xs text-text-secondary">Conversion</div>
          </div>
        </div>

        <div className="rounded-xl border border-success/20 bg-success/10 p-4">
          <div className="text-center">
            <div className="mb-1 text-lg font-bold text-text-primary">Top Performer</div>
            <div className="text-sm text-text-secondary">You&apos;re in the top 5% of suppliers this month!</div>
            <Button type="button" size="sm" className="mt-2 rounded-lg px-4 text-xs">
              View Details
            </Button>
          </div>
        </div>
      </div>
      <div className={`mt-4 inline-flex rounded-full border px-2 py-1 text-xs ${STATUS_TONE_CLASS_MAP.success}`}>
        KPI drift: stable week-over-week
      </div>
    </DashboardPanel>
  )
}

export default QuickStats
