import { Calculator, Weight, Ruler, MapPin, Gauge, Shield, CheckCircle, Info } from "lucide-react"

const costFactors = [
  {
    icon: Weight,
    title: "Package Weight",
    description: "Total weight including protective packaging materials",
  },
  {
    icon: Ruler,
    title: "Package Dimensions",
    description: "Length, width, and height for volumetric calculations",
  },
  {
    icon: MapPin,
    title: "Destination Address",
    description: "Shipping zone and distance from fulfillment center",
  },
  {
    icon: Gauge,
    title: "Delivery Speed",
    description: "Same-day, express, or standard shipping selection",
  },
  {
    icon: Shield,
    title: "Insurance & Handling",
    description: "Optional coverage for high-value shipments",
  },
]

const transparencyItems = [
  "Exact shipping cost displayed before checkout completion",
  "Multiple carrier options with rate comparison",
  "No hidden fees or surprise charges",
  "Volume discounts automatically applied for bulk orders",
]

export default function ShippingCostStructureSection() {
  return (
    <section id="shipping-cost-structure" className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">
            Shipping Cost Structure
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Transparent pricing calculated at checkout based on your order specifics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-steel-blue rounded-xl flex items-center justify-center mr-4">
                <Calculator className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Cost Calculation Factors</h3>
            </div>
            <div className="space-y-4">
              {costFactors.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start p-4 bg-light-mint-gray rounded-lg">
                    <Icon className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-4 mt-1 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="bg-gradient-to-br from-pale-lime to-lime-200 rounded-xl sm:rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-4">Pricing Transparency</h3>
              <div className="space-y-4">
                {transparencyItems.map((text) => (
                  <div key={text} className="flex items-start">
                    <CheckCircle className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
                    <p className="text-sm sm:text-base text-gray-800">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-steel-blue mb-4">Special Pricing Notes</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-steel-blue pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Same-Day Premium</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Uber Direct pricing reflects urgent delivery service and local courier costs
                  </p>
                </div>
                <div className="border-l-4 border-steel-blue pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">International Duties</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Customs fees, duties, and taxes are customer responsibility unless otherwise stated
                  </p>
                </div>
                <div className="border-l-4 border-steel-blue pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Bulk Discounts</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Large orders may qualify for negotiated freight rates—contact sales team
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start">
                <Info className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold text-steel-blue mb-2 text-sm sm:text-base">Free Shipping Threshold</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Standard shipping is free on orders over $500 within the continental U.S.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
