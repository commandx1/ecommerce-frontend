import { Clock, DollarSign, Heart, type LucideIcon, ShoppingBag } from "lucide-react"
import dashboardMetricsData from "@/data/dashboard-metrics.json"

const iconMap: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  "dollar-sign": DollarSign,
  clock: Clock,
  heart: Heart,
}

const colorMap: Record<string, string> = {
  blue: "bg-brand/15 text-brand",
  green: "bg-success/15 text-success",
  "coral-orange": "bg-coral-orange/20 text-coral-orange",
  purple: "bg-warning/20 text-warning",
}

const MetricsCards = () => {
  return (
    <section id="metrics-section" className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardMetricsData.metrics.map((metric) => {
          const IconComponent = iconMap[metric.icon]
          const iconColorClass = colorMap[metric.iconColor] || "bg-surface-muted text-text-secondary"
          const changeColorClass =
            metric.changeType === "positive"
              ? "text-success"
              : metric.changeType === "warning"
                ? "text-coral-orange"
                : "text-text-muted"

          return (
            <div key={metric.id} className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconColorClass}`}>
                  {IconComponent && <IconComponent className="text-xl w-6 h-6" />}
                </div>
                <span className={`${changeColorClass} text-sm font-medium`}>{metric.change}</span>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-text-primary">{metric.value}</h3>
              <p className="text-text-secondary">{metric.title}</p>
              <p className="mt-2 text-sm text-text-muted">{metric.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MetricsCards
