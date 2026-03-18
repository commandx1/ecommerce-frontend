import {
  Clock,
  Check,
  Zap,
  Truck,
  Globe,
  AlertTriangle,
  Circle,
} from "lucide-react"

const steps = [
  {
    step: 1,
    title: "Order Received",
    description: "Confirmation sent immediately upon order placement",
    note: "Within minutes",
  },
  {
    step: 2,
    title: "Order Processing",
    description: "Verification, picking, and professional packaging",
    note: "1–2 business days",
  },
  {
    step: 3,
    title: "Shipment Dispatch",
    description: "Handed to carrier with tracking information",
    note: "After processing complete",
  },
  {
    step: 4,
    title: "Delivery Complete",
    description: "Arrival at your practice or facility",
    note: "Based on shipping method",
    isLast: true,
  },
]

const considerations = [
  "Weekend and holiday orders process next business day",
  "International shipments may experience customs delays",
  "Weather conditions may affect delivery timelines",
  "Bulk orders may require additional processing time",
]

const speedCards = [
  { icon: Zap, value: "2–4h", title: "Uber Direct", desc: "Same-day local", bg: "bg-pale-lime/20" },
  { icon: Truck, value: "1–2d", title: "Express Shipping", desc: "Priority overnight", bg: "bg-blue-50" },
  { icon: Truck, value: "2–5d", title: "Standard Shipping", desc: "Ground delivery", bg: "bg-blue-50" },
  { icon: Globe, value: "5–10d", title: "International", desc: "Customs included", bg: "bg-blue-50" },
]

export default function DeliveryTimelinesSection() {
  return (
    <section
      id="delivery-timelines"
      className="py-12 sm:py-16 lg:py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">
            Delivery Timelines
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding processing times and expected delivery windows
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="bg-light-mint-gray rounded-xl sm:rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-6">
              Standard Processing Timeline
            </h3>
            <div className="space-y-6">
              {steps.map((s) => (
                <div key={s.step} className="flex items-start">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${s.isLast ? "bg-pale-lime" : "bg-steel-blue"}`}
                  >
                    {s.isLast ? (
                      <Check className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <span className="text-white font-bold text-sm sm:text-base">
                        {s.step}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                      {s.title}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-600">
                      {s.description}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {s.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="bg-linear-to-br from-steel-blue to-blue-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
              <div className="flex items-center mb-4">
                <Clock className="text-pale-lime w-8 h-8 sm:w-10 sm:h-10 mr-4" />
                <h3 className="text-xl sm:text-2xl font-bold">
                  Same-Day Cut-Off Times
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm sm:text-base">
                      Uber Direct Orders
                    </span>
                    <span className="text-pale-lime font-bold text-base sm:text-lg">
                      2:00 PM Local
                    </span>
                  </div>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    Orders placed before 2 PM qualify for same-day delivery
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm sm:text-base">
                      Standard Shippo Orders
                    </span>
                    <span className="text-pale-lime font-bold text-base sm:text-lg">
                      4:00 PM EST
                    </span>
                  </div>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    Next business day dispatch guaranteed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-6 sm:p-8">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-600 w-6 h-6 sm:w-8 sm:h-8 mr-4 mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-yellow-900 mb-3">
                    Important Considerations
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base text-yellow-800">
                    {considerations.map((item) => (
                      <li key={item} className="flex items-start">
                        <Circle className="text-yellow-600 w-2 h-2 mr-2 mt-2 shrink-0 fill-current" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-6 text-center">
            Delivery Speed Comparison
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {speedCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="text-center">
                  <div
                    className={`${card.bg} rounded-xl p-4 sm:p-6 mb-3`}
                  >
                    <Icon className="text-steel-blue w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl font-bold text-steel-blue">
                      {card.value}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                    {card.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {card.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
