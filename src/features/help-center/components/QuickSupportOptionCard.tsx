import type { LucideIcon } from "lucide-react"

interface QuickSupportOptionCardProps {
  title: string
  description: string
  badge: string
  badgeTone: "green" | "gray" | "steel"
  Icon: LucideIcon
}

const badgeColorMap: Record<QuickSupportOptionCardProps["badgeTone"], string> = {
  green: "text-green-600",
  gray: "text-gray-500",
  steel: "text-steel-blue",
}

const QuickSupportOptionCard = ({ title, description, badge, badgeTone, Icon }: QuickSupportOptionCardProps) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-opacity-90 transition-colors">
        <Icon className="text-white w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-steel-blue mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className={`text-sm font-medium ${badgeColorMap[badgeTone]}`}>{badge}</div>
    </div>
  )
}

export default QuickSupportOptionCard
