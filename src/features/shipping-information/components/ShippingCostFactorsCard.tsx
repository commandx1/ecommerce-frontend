import { Calculator, Gauge, MapPin, Ruler, Shield, Weight } from "lucide-react"

const COST_FACTORS = [
  { icon: Weight, title: "Package Weight", description: "Total weight including protective packaging materials" },
  { icon: Ruler, title: "Package Dimensions", description: "Length, width, and height for volumetric calculations" },
  { icon: MapPin, title: "Destination Address", description: "Shipping zone and distance from fulfillment center" },
  { icon: Gauge, title: "Delivery Speed", description: "Same-day, express, or standard shipping selection" },
  { icon: Shield, title: "Insurance & Handling", description: "Optional coverage for high-value shipments" },
] as const

export default function ShippingCostFactorsCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <div className="mb-6 flex items-center">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface sm:h-14 sm:w-14">
          <Calculator className="h-6 w-6 text-inverse-foreground sm:h-8 sm:w-8" />
        </div>
        <h3 className="text-xl font-bold text-text-primary sm:text-2xl">Cost Calculation Factors</h3>
      </div>
      <div className="space-y-4">
        {COST_FACTORS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start rounded-lg bg-surface-muted/60 p-4">
            <Icon className="mr-4 mt-1 h-5 w-5 shrink-0 text-brand sm:h-6 sm:w-6" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-text-primary sm:text-base">{title}</h4>
              <p className="text-xs text-text-secondary sm:text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
