import { Clock, DollarSign, Heart, type LucideIcon, ShoppingBag } from "lucide-react"
import dashboardMetricsData from "@/data/dashboard-metrics.json"

const iconMap: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  "dollar-sign": DollarSign,
  clock: Clock,
  heart: Heart,
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  "coral-orange": "bg-coral-orange/20 text-coral-orange",
  purple: "bg-purple-100 text-purple-600",
}

const MetricsCards = () => {
  return (
    <section id="metrics-section" className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardMetricsData.metrics.map((metric) => {
          const IconComponent = iconMap[metric.icon]
          const iconColorClass = colorMap[metric.iconColor] || "bg-gray-100 text-gray-600"
          const changeColorClass =
            metric.changeType === "positive"
              ? "text-green-500"
              : metric.changeType === "warning"
                ? "text-coral-orange"
                : "text-gray-500"

          return (
            <div key={metric.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${iconColorClass} rounded-lg flex items-center justify-center`}>
                  {IconComponent && <IconComponent className="text-xl w-6 h-6" />}
                </div>
                <span className={`${changeColorClass} text-sm font-medium`}>{metric.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-steel-blue mb-1">{metric.value}</h3>
              <p className="text-gray-600">{metric.title}</p>
              <p className="text-sm text-gray-500 mt-2">{metric.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MetricsCards
