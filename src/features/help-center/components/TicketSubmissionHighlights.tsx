import type { LucideIcon } from "lucide-react"
import { Clock, TrendingUp, User } from "lucide-react"

interface HighlightItem {
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

const HIGHLIGHTS: HighlightItem[] = [
  {
    title: "Quick Response",
    description: "Average response time: 2 hours",
    icon: Clock,
    iconBg: "bg-success/14",
    iconColor: "text-success",
  },
  {
    title: "Expert Support",
    description: "Dental industry specialists",
    icon: User,
    iconBg: "bg-brand/12",
    iconColor: "text-brand",
  },
  {
    title: "Full Tracking",
    description: "Track your ticket status",
    icon: TrendingUp,
    iconBg: "bg-accent",
    iconColor: "text-brand",
  },
]

const TicketSubmissionHighlights = () => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
      {HIGHLIGHTS.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.title} className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${item.iconBg}`}>
              <Icon className={`h-6 w-6 ${item.iconColor}`} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">{item.title}</h3>
            <p className="text-text-secondary">{item.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export default TicketSubmissionHighlights
