import { ArrowRight, ChartLine, Check, DollarSign, Eye, X } from "lucide-react"
import vendorNotificationsData from "@/data/vendor-notifications.json"
import { cn } from "@/lib/utils"
import DashboardPanel from "./shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  times: X,
  check: Check,
  eye: Eye,
  "dollar-sign": DollarSign,
  "chart-line": ChartLine,
}

const colorMap: Record<string, { bg: string; border: string; dot: string; icon: string }> = {
  red: {
    bg: "bg-danger/10",
    border: "border-danger/20",
    dot: DOT_TONE_CLASS_MAP.danger,
    icon: "text-danger",
  },
  green: {
    bg: "bg-success/10",
    border: "border-success/20",
    dot: DOT_TONE_CLASS_MAP.success,
    icon: "text-success",
  },
  blue: {
    bg: "bg-brand/10",
    border: "border-brand/20",
    dot: DOT_TONE_CLASS_MAP.info,
    icon: "text-brand",
  },
  yellow: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    dot: DOT_TONE_CLASS_MAP.warning,
    icon: "text-warning",
  },
  purple: {
    bg: "bg-brand/10",
    border: "border-brand/20",
    dot: "bg-brand-strong",
    icon: "text-brand-strong",
  },
}

const VendorNotifications = () => {
  return (
    <DashboardPanel
      title="Notifications & Alerts"
      action={
        <button type="button" className="text-sm text-brand transition-colors hover:text-brand-strong">
          Mark All Read
        </button>
      }
    >
      <div className="space-y-4">
        {vendorNotificationsData.notifications.map((notification) => {
          const colors = colorMap[notification.color] || {
            bg: "bg-surface-muted",
            border: "border-border-soft",
            dot: DOT_TONE_CLASS_MAP.neutral,
            icon: "text-text-muted",
          }
          const IconComponent = iconMap[notification.icon]

          return (
            <div
              key={notification.id}
              className={cn("flex items-start rounded-xl border p-4", colors.bg, colors.border)}
            >
              <div className={`w-3 h-3 ${colors.dot} rounded-full mt-2 mr-3 shrink-0`}></div>
              <div className="flex-1">
                <div className="mb-1 font-medium text-text-primary">{notification.title}</div>
                <div className="mb-2 text-sm text-text-secondary">{notification.message}</div>
                <div className="text-xs text-text-muted">{notification.time}</div>
              </div>
              <button type="button" className={cn(colors.icon, "transition-opacity hover:opacity-70")}>
                {IconComponent && <IconComponent className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          className="mx-auto flex items-center text-sm font-medium text-brand transition-colors hover:text-brand-strong"
        >
          View All Notifications
          <ArrowRight className="ml-1 w-4 h-4" />
        </button>
      </div>
    </DashboardPanel>
  )
}

export default VendorNotifications
