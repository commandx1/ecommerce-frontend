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
  description,
  features,
  title,
  icon,
}: {
  description: string
  features: readonly string[]
  title: string
  icon: "uber" | "shippo"
}) {
  const Icon = icon === "uber" ? Zap : Truck
  const iconWrapperClass = icon === "uber" ? "bg-accent-strong/25" : "bg-brand-surface"
  const iconClass = icon === "uber" ? "text-brand-strong" : "text-inverse-foreground"

  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <div className="mb-4 flex items-center sm:mb-6">
        <div
          className={`mr-4 flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${iconWrapperClass}`}
        >
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconClass}`} />
        </div>
        <h3 className="text-xl font-bold text-text-primary sm:text-2xl">{title}</h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-text-secondary sm:mb-6 sm:text-base">{description}</p>
      <div className="space-y-3">
        {features.map((text) => (
          <div key={text} className="flex items-start">
            <CheckCircle className="mr-3 mt-1 h-5 w-5 shrink-0 text-success" />
            <span className="text-sm text-text-primary sm:text-base">{text}</span>
          </div>
        ))}
        {icon === "uber" ? (
          <div className="flex items-start">
            <Info className="mr-3 mt-1 h-5 w-5 shrink-0 text-text-muted" />
            <span className="text-sm text-text-secondary sm:text-base">Limited to orders under 50 lbs</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ShippingProviderCards() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-2">
      <ProviderCard
        description="For time-sensitive local deliveries within select metropolitan areas. Ideal for urgent supply needs and emergency orders."
        features={UBER_FEATURES}
        title="Uber Direct"
        icon="uber"
      />
      <ProviderCard
        description="Multi-carrier shipping platform supporting nationwide and international deliveries with comprehensive tracking and insurance options."
        features={SHIPPO_FEATURES}
        title="Shippo"
        icon="shippo"
      />
    </div>
  )
}
