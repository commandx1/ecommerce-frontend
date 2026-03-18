import { Zap, Truck, MapPin, Package } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Same-Day Delivery",
    description: "Local courier service",
  },
  {
    icon: Truck,
    title: "Multi-Carrier",
    description: "National & international",
  },
  {
    icon: MapPin,
    title: "Real-Time Tracking",
    description: "Full transparency",
  },
  {
    icon: Package,
    title: "Bulk Orders",
    description: "Enterprise fulfillment",
  },
]

export default function ShippingHero() {
  return (
    <section id="hero-section" className="bg-linear-to-br from-steel-blue to-blue-800 py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">Shipping Information</h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
            Reliable and scalable delivery solutions powered by Uber Direct and Shippo
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {features.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pale-lime rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Icon className="text-steel-blue w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-blue-100 text-xs sm:text-sm">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
