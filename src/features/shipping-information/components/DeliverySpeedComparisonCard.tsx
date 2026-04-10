import { Globe, Truck, Zap } from "lucide-react"

const SPEED_CARDS = [
  {
    icon: Zap,
    value: "2–4h",
    title: "Uber Direct",
    description: "Same-day local",
    backgroundClass: "bg-accent-strong/20",
  },
  {
    icon: Truck,
    value: "1–2d",
    title: "Express Shipping",
    description: "Priority overnight",
    backgroundClass: "bg-brand/12",
  },
  {
    icon: Truck,
    value: "2–5d",
    title: "Standard Shipping",
    description: "Ground delivery",
    backgroundClass: "bg-brand/12",
  },
  {
    icon: Globe,
    value: "5–10d",
    title: "International",
    description: "Customs included",
    backgroundClass: "bg-brand/12",
  },
] as const

export default function DeliverySpeedComparisonCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <h3 className="mb-6 text-center text-xl font-bold text-text-primary sm:text-2xl">Delivery Speed Comparison</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {SPEED_CARDS.map(({ icon: Icon, value, title, description, backgroundClass }) => (
          <div key={title} className="text-center">
            <div className={`${backgroundClass} rounded-xl p-4 sm:p-6 mb-3`}>
              <Icon className="mx-auto mb-2 h-8 w-8 text-brand sm:h-10 sm:w-10" />
              <div className="text-2xl font-bold text-brand sm:text-3xl">{value}</div>
            </div>
            <h4 className="text-sm font-semibold text-text-primary sm:text-base">{title}</h4>
            <p className="text-xs text-text-secondary sm:text-sm">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
