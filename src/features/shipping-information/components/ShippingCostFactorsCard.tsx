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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-steel-blue rounded-xl flex items-center justify-center mr-4">
          <Calculator className="text-white w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Cost Calculation Factors</h3>
      </div>
      <div className="space-y-4">
        {COST_FACTORS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start p-4 bg-gray-50 rounded-lg">
            <Icon className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-4 mt-1 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{title}</h4>
              <p className="text-xs sm:text-sm text-gray-600">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
