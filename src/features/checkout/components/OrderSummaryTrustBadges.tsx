import { Award, HeadphonesIcon, Lock } from "lucide-react"

const TRUST_BADGES = [
  {
    body: "Your payment information is encrypted and secure. We use industry-standard SSL protection.",
    containerClass: "border-success/20 bg-success/10",
    icon: Lock,
    iconClass: "text-success",
    textClass: "text-text-primary",
    bodyClass: "text-text-secondary",
    title: "Secure Payment",
  },
  {
    body: "30-day return policy on unopened items. Professional-grade quality guaranteed.",
    containerClass: "border-brand/20 bg-accent",
    icon: Award,
    iconClass: "text-brand",
    textClass: "text-text-primary",
    bodyClass: "text-text-secondary",
    title: "Satisfaction Guarantee",
  },
  /* {
    body: "Dedicated account manager and 24/7 technical support for all equipment purchases.",
    containerClass: "border-warning/20 bg-warning/10",
    icon: HeadphonesIcon,
    iconClass: "text-warning",
    textClass: "text-text-primary",
    bodyClass: "text-text-secondary",
    title: "Expert Support",
  }, */
] as const

export default function OrderSummaryTrustBadges() {
  return (
    <div className="space-y-4">
      {TRUST_BADGES.map((badge) => {
        const Icon = badge.icon
        return (
          <div key={badge.title} className={`rounded-lg border p-4 ${badge.containerClass}`}>
            <div className="mb-2 flex items-center">
              <Icon className={`mr-2 h-4 w-4 ${badge.iconClass}`} />
              <span className={`text-sm font-medium ${badge.textClass}`}>{badge.title}</span>
            </div>
            <p className={`text-xs ${badge.bodyClass}`}>{badge.body}</p>
          </div>
        )
      })}
    </div>
  )
}
