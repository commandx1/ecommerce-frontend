import { AlertTriangle, Bell, CheckCircle, type LucideIcon, Tag, Truck } from "lucide-react"
import dashboardNotificationsData from "@/data/dashboard-notifications.json"

const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  "check-circle": CheckCircle,
  "exclamation-triangle": AlertTriangle,
  tag: Tag,
  bell: Bell,
}

const bgColorMap: Record<string, string> = {
  blue: "bg-blue-50",
  green: "bg-green-50",
  "coral-orange": "bg-coral-orange/10",
  purple: "bg-purple-50",
  gray: "bg-gray-50",
}

const iconBgColorMap: Record<string, string> = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  "coral-orange": "bg-coral-orange/20",
  purple: "bg-purple-100",
  gray: "bg-gray-100",
}

const iconTextColorMap: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  "coral-orange": "text-coral-orange",
  purple: "text-purple-600",
  gray: "text-gray-600",
}

const Notifications = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-steel-blue">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Recent alerts and updates</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardNotificationsData.notifications.map((notification) => {
            const IconComponent = iconMap[notification.icon]
            const bgColorClass = bgColorMap[notification.iconColor] || "bg-gray-50"
            const iconBgColorClass = iconBgColorMap[notification.iconColor] || "bg-gray-100"
            const iconTextColorClass = iconTextColorMap[notification.iconColor] || "text-gray-600"

            return (
              <div key={notification.id} className={`flex items-start space-x-4 p-4 ${bgColorClass} rounded-lg`}>
                <div className={`w-8 h-8 ${iconBgColorClass} rounded-full flex items-center justify-center shrink-0`}>
                  {IconComponent && <IconComponent className={`${iconTextColorClass} text-sm w-4 h-4`} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-steel-blue text-sm">{notification.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6">
          <button type="button" className="w-full text-steel-blue hover:underline font-medium text-sm">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notifications
