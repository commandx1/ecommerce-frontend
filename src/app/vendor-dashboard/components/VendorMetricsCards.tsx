import { DollarSign, type LucideIcon, ShoppingBag, Star, Users } from "lucide-react"
import vendorMetricsData from "@/data/vendor-metrics.json"
import { cn } from "@/lib/utils"
import { RING_TONE_CLASS_MAP, STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const iconMap: Record<string, LucideIcon> = {
  "dollar-sign": DollarSign,
  "shopping-bag": ShoppingBag,
  users: Users,
  star: Star,
}

const colorMap: Record<string, string> = {
  green: RING_TONE_CLASS_MAP.success,
  blue: RING_TONE_CLASS_MAP.info,
  purple: RING_TONE_CLASS_MAP.info,
  orange: RING_TONE_CLASS_MAP.warning,
}

const VendorMetricsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {vendorMetricsData.metrics.map((metric) => {
        const IconComponent = iconMap[metric.icon]
        const iconColorClass = colorMap[metric.iconColor] || RING_TONE_CLASS_MAP.neutral
        const changeToneClass =
          metric.changeType === "positive" ? STATUS_TONE_CLASS_MAP.success : STATUS_TONE_CLASS_MAP.warning

        return (
          <div
            key={metric.id}
            className="mb-6 rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", iconColorClass)}>
                {IconComponent && <IconComponent className="text-xl w-6 h-6" />}
              </div>
              <span className={cn("rounded-full border px-2 py-1 text-sm font-medium", changeToneClass)}>
                {metric.change}
              </span>
            </div>
            <div className="mb-1 text-2xl font-bold text-text-primary">{metric.value}</div>
            <div className="text-sm text-text-secondary">{metric.title}</div>
            <div className="mt-2 text-xs text-text-muted">{metric.description}</div>
          </div>
        )
      })}
    </div>
  )
}

export default VendorMetricsCards
