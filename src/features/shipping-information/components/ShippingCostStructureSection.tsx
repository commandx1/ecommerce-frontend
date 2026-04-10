import PageSectionContainer from "@/components/layout/PageSectionContainer"
import FreeShippingNote from "@/features/shipping-information/components/FreeShippingNote"
import ShippingCostFactorsCard from "@/features/shipping-information/components/ShippingCostFactorsCard"
import ShippingPricingNotesCard from "@/features/shipping-information/components/ShippingPricingNotesCard"
import ShippingPricingTransparencyCard from "@/features/shipping-information/components/ShippingPricingTransparencyCard"
import ShippingSectionHeading from "@/features/shipping-information/components/ShippingSectionHeading"

export default function ShippingCostStructureSection() {
  return (
    <PageSectionContainer as="section" className="bg-surface py-12 sm:py-16 lg:py-20">
      <ShippingSectionHeading
        title="Shipping Cost Structure"
        description="Transparent pricing calculated at checkout based on your order specifics"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
        <ShippingCostFactorsCard />
        <div className="space-y-6 sm:space-y-8">
          <ShippingPricingTransparencyCard />
          <ShippingPricingNotesCard />
          <FreeShippingNote />
        </div>
      </div>
    </PageSectionContainer>
  )
}
