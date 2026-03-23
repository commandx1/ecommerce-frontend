"use client"

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
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Expert Support",
    description: "Dental industry specialists",
    icon: User,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Full Tracking",
    description: "Track your ticket status",
    icon: TrendingUp,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
]

const TicketSubmissionHighlights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {HIGHLIGHTS.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.title} className="text-center">
            <div className={`w-16 h-16 ${item.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`${item.iconColor} w-6 h-6`} />
            </div>
            <h3 className="text-lg font-semibold text-steel-blue mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export default TicketSubmissionHighlights
