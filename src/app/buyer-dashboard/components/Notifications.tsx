import { AlertTriangle, Bell, CheckCircle, type LucideIcon, Tag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import dashboardNotificationsData from "@/data/dashboard-notifications.json"

const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  "check-circle": CheckCircle,
  "exclamation-triangle": AlertTriangle,
  tag: Tag,
  bell: Bell,
}

const bgColorMap: Record<string, string> = {
  blue: "bg-brand/8",
  green: "bg-success/10",
  "coral-orange": "bg-coral-orange/10",
  purple: "bg-warning/12",
  gray: "bg-surface-muted/55",
}

const iconBgColorMap: Record<string, string> = {
  blue: "bg-brand/15",
  green: "bg-success/15",
  "coral-orange": "bg-coral-orange/20",
  purple: "bg-warning/20",
  gray: "bg-surface-muted",
}

const iconTextColorMap: Record<string, string> = {
  blue: "text-brand",
  green: "text-success",
  "coral-orange": "text-coral-orange",
  purple: "text-warning",
  gray: "text-text-secondary",
}

const Notifications = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
        <p className="mt-1 text-sm text-text-secondary">Recent alerts and updates</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardNotificationsData.notifications.map((notification) => {
            const IconComponent = iconMap[notification.icon]
            const bgColorClass = bgColorMap[notification.iconColor] || "bg-surface-muted/55"
            const iconBgColorClass = iconBgColorMap[notification.iconColor] || "bg-surface-muted"
            const iconTextColorClass = iconTextColorMap[notification.iconColor] || "text-text-secondary"

            return (
              <div key={notification.id} className={`flex items-start space-x-4 p-4 ${bgColorClass} rounded-lg`}>
                <div className={`w-8 h-8 ${iconBgColorClass} rounded-full flex items-center justify-center shrink-0`}>
                  {IconComponent && <IconComponent className={`${iconTextColorClass} text-sm w-4 h-4`} />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">{notification.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{notification.message}</p>
                  <p className="mt-2 text-xs text-text-muted">{notification.time}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 border-t border-border-soft pt-4">
          <Button type="button" variant="link" className="h-auto w-full p-0 text-sm">
            View All Notifications
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Notifications
