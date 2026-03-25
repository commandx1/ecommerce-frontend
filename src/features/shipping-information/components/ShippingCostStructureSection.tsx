import FreeShippingNote from "@/features/shipping-information/components/FreeShippingNote"
import ShippingCostFactorsCard from "@/features/shipping-information/components/ShippingCostFactorsCard"
import ShippingPricingNotesCard from "@/features/shipping-information/components/ShippingPricingNotesCard"
import ShippingPricingTransparencyCard from "@/features/shipping-information/components/ShippingPricingTransparencyCard"

export default function ShippingCostStructureSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
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
          <ShippingCostFactorsCard />
          <div className="space-y-6 sm:space-y-8">
            <ShippingPricingTransparencyCard />
            <ShippingPricingNotesCard />
            <FreeShippingNote />
          </div>
        </div>
      </div>
    </section>
  )
}
