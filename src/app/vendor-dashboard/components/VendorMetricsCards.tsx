import { DollarSign, type LucideIcon, ShoppingBag, Star, Users } from "lucide-react"
import vendorMetricsData from "@/data/vendor-metrics.json"

const iconMap: Record<string, LucideIcon> = {
  "dollar-sign": DollarSign,
  "shopping-bag": ShoppingBag,
  users: Users,
  star: Star,
}

const colorMap: Record<string, string> = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
}

const VendorMetricsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {vendorMetricsData.metrics.map((metric) => {
        const IconComponent = iconMap[metric.icon]
        const iconColorClass = colorMap[metric.iconColor] || "bg-gray-100 text-gray-600"

        return (
          <div key={metric.id} className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${iconColorClass} rounded-xl flex items-center justify-center`}>
                {IconComponent && <IconComponent className="text-xl w-6 h-6" />}
              </div>
              <span className="text-green-500 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-steel-blue mb-1">{metric.value}</div>
            <div className="text-gray-600 text-sm">{metric.title}</div>
            <div className="text-xs text-gray-500 mt-2">{metric.description}</div>
          </div>
        )
      })}
    </div>
  )
}

export default VendorMetricsCards
