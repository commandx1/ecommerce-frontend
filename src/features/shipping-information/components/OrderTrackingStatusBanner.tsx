import { Check, MapPin, Package, Truck } from "lucide-react"

const TRACKING_STEPS = [
  { icon: Check, title: "Order Confirmed", description: "Received & verified", active: true },
  { icon: Package, title: "Shipped", description: "In transit", active: false },
  { icon: Truck, title: "Out for Delivery", description: "Final mile", active: false },
  { icon: MapPin, title: "Delivered", description: "Completed", active: false },
] as const

export default function OrderTrackingStatusBanner() {
  return (
    <div className="bg-gradient-to-br from-steel-blue to-blue-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 mb-8 sm:mb-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
          {TRACKING_STEPS.map(({ icon: Icon, title, description, active }, index) => (
            <div key={title} className="text-center">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ${
                  active ? "bg-pale-lime" : "bg-white/20"
                }`}
              >
                <Icon className={`${active ? "text-steel-blue" : "text-white"} w-5 h-5 sm:w-6 sm:h-6`} />
              </div>
              {index < TRACKING_STEPS.length - 1 ? (
                <div className={`h-1 mb-3 sm:mb-4 hidden sm:block ${active ? "bg-pale-lime" : "bg-white/30"}`} />
              ) : null}
              <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{title}</h3>
              <p className="text-blue-100 text-xs sm:text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
