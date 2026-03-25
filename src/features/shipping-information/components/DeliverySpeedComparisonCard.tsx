import { Globe, Truck, Zap } from "lucide-react"

const SPEED_CARDS = [
  { icon: Zap, value: "2–4h", title: "Uber Direct", description: "Same-day local", backgroundClass: "bg-pale-lime/20" },
  {
    icon: Truck,
    value: "1–2d",
    title: "Express Shipping",
    description: "Priority overnight",
    backgroundClass: "bg-blue-50",
  },
  {
    icon: Truck,
    value: "2–5d",
    title: "Standard Shipping",
    description: "Ground delivery",
    backgroundClass: "bg-blue-50",
  },
  {
    icon: Globe,
    value: "5–10d",
    title: "International",
    description: "Customs included",
    backgroundClass: "bg-blue-50",
  },
] as const

export default function DeliverySpeedComparisonCard() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
      <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-6 text-center">Delivery Speed Comparison</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {SPEED_CARDS.map(({ icon: Icon, value, title, description, backgroundClass }) => (
          <div key={title} className="text-center">
            <div className={`${backgroundClass} rounded-xl p-4 sm:p-6 mb-3`}>
              <Icon className="text-steel-blue w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-bold text-steel-blue">{value}</div>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h4>
            <p className="text-xs sm:text-sm text-gray-600">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
