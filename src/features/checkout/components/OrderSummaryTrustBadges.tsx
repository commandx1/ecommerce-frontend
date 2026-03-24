import { Award, HeadphonesIcon, Lock } from "lucide-react"

const TRUST_BADGES = [
  {
    body: "Your payment information is encrypted and secure. We use industry-standard SSL protection.",
    containerClass: "bg-green-50 border-green-200",
    icon: Lock,
    iconClass: "text-green-600",
    textClass: "text-green-800",
    title: "Secure Payment",
  },
  {
    body: "30-day return policy on unopened items. Professional-grade quality guaranteed.",
    containerClass: "bg-blue-50 border-blue-200",
    icon: Award,
    iconClass: "text-blue-600",
    textClass: "text-blue-800",
    title: "Satisfaction Guarantee",
  },
  {
    body: "Dedicated account manager and 24/7 technical support for all equipment purchases.",
    containerClass: "bg-purple-50 border-purple-200",
    icon: HeadphonesIcon,
    iconClass: "text-purple-600",
    textClass: "text-purple-800",
    title: "Expert Support",
  },
] as const

export default function OrderSummaryTrustBadges() {
  return (
    <div className="space-y-4">
      {TRUST_BADGES.map((badge) => {
        const Icon = badge.icon
        return (
          <div key={badge.title} className={`border rounded-lg p-4 ${badge.containerClass}`}>
            <div className="flex items-center mb-2">
              <Icon className={`w-4 h-4 mr-2 ${badge.iconClass}`} />
              <span className={`text-sm font-medium ${badge.textClass}`}>{badge.title}</span>
            </div>
            <p className={`text-xs ${badge.textClass.replace("800", "700")}`}>{badge.body}</p>
          </div>
        )
      })}
    </div>
  )
}
