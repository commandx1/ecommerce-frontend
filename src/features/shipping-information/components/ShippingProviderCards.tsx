import { CheckCircle, Info, Truck, Zap } from "lucide-react"

const UBER_FEATURES = [
  "Same-day delivery within 2–4 hours",
  "Live courier tracking with ETA updates",
  "Direct-to-practice delivery",
] as const

const SHIPPO_FEATURES = [
  "Access to UPS, FedEx, USPS, DHL, and more",
  "Bulk shipment support with pallet options",
  "International customs documentation",
  "Automatic rate comparison at checkout",
] as const

function ProviderCard({
  accentClass,
  description,
  features,
  title,
  icon,
}: {
  accentClass: string
  description: string
  features: readonly string[]
  title: string
  icon: "uber" | "shippo"
}) {
  const Icon = icon === "uber" ? Zap : Truck
  const iconWrapperClass = icon === "uber" ? "bg-pale-lime" : "bg-steel-blue"
  const iconClass = icon === "uber" ? "text-steel-blue" : "text-white"

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 ${accentClass}`}>
      <div className="flex items-center mb-4 sm:mb-6">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mr-4 ${iconWrapperClass}`}
        >
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconClass}`} />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">{title}</h3>
      </div>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">{description}</p>
      <div className="space-y-3">
        {features.map((text) => (
          <div key={text} className="flex items-start">
            <CheckCircle className="text-green-500 w-5 h-5 mr-3 mt-1 shrink-0" />
            <span className="text-sm sm:text-base text-gray-700">{text}</span>
          </div>
        ))}
        {icon === "uber" ? (
          <div className="flex items-start">
            <Info className="text-gray-400 w-5 h-5 mr-3 mt-1 shrink-0" />
            <span className="text-sm sm:text-base text-gray-600">Limited to orders under 50 lbs</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ShippingProviderCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
      <ProviderCard
        accentClass=""
        description="For time-sensitive local deliveries within select metropolitan areas. Ideal for urgent supply needs and emergency orders."
        features={UBER_FEATURES}
        title="Uber Direct"
        icon="uber"
      />
      <ProviderCard
        accentClass=""
        description="Multi-carrier shipping platform supporting nationwide and international deliveries with comprehensive tracking and insurance options."
        features={SHIPPO_FEATURES}
        title="Shippo"
        icon="shippo"
      />
    </div>
  )
}
