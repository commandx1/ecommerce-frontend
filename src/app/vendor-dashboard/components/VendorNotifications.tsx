import { ArrowRight, ChartLine, Check, DollarSign, Eye, X } from "lucide-react"
import vendorNotificationsData from "@/data/vendor-notifications.json"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  times: X,
  check: Check,
  eye: Eye,
  "dollar-sign": DollarSign,
  "chart-line": ChartLine,
}

const colorMap: Record<string, { bg: string; border: string; dot: string; icon: string }> = {
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: "text-red-500",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
    icon: "text-green-500",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: "text-blue-500",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
    icon: "text-yellow-500",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    dot: "bg-purple-500",
    icon: "text-purple-500",
  },
}

const VendorNotifications = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Notifications & Alerts</h2>
        <button type="button" className="text-steel-blue hover:text-opacity-80 text-sm">
          Mark All Read
        </button>
      </div>

      <div className="space-y-4">
        {vendorNotificationsData.notifications.map((notification) => {
          const colors = colorMap[notification.color]
          const IconComponent = iconMap[notification.icon]

          return (
            <div
              key={notification.id}
              className={`flex items-start p-4 ${colors.bg} border ${colors.border} rounded-xl`}
            >
              <div className={`w-3 h-3 ${colors.dot} rounded-full mt-2 mr-3 shrink-0`}></div>
              <div className="flex-1">
                <div className="font-medium text-steel-blue mb-1">{notification.title}</div>
                <div className="text-sm text-gray-600 mb-2">{notification.message}</div>
                <div className="text-xs text-gray-500">{notification.time}</div>
              </div>
              <button type="button" className={`${colors.icon} hover:opacity-70`}>
                {IconComponent && <IconComponent className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-steel-blue hover:text-opacity-80 text-sm font-medium flex items-center mx-auto"
        >
          View All Notifications
          <ArrowRight className="ml-1 w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default VendorNotifications
