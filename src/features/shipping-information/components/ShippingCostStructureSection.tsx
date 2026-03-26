import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import FreeShippingNote from "@/features/shipping-information/components/FreeShippingNote"
import ShippingCostFactorsCard from "@/features/shipping-information/components/ShippingCostFactorsCard"
import ShippingPricingNotesCard from "@/features/shipping-information/components/ShippingPricingNotesCard"
import ShippingPricingTransparencyCard from "@/features/shipping-information/components/ShippingPricingTransparencyCard"

export default function ShippingCostStructureSection() {
  return (
    <PageSectionContainer as="section" className="py-12 sm:py-16 lg:py-20">
      <SectionHeading
        title="Shipping Cost Structure"
        description="Transparent pricing calculated at checkout based on your order specifics"
        className="mb-8 sm:mb-12 justify-center"
        titleClassName="text-2xl sm:text-3xl lg:text-4xl text-center mb-3 sm:mb-4"
        descriptionClassName="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-center"
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
