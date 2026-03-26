import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import ShippingMethodsTable from "@/features/shipping-information/components/ShippingMethodsTable"
import ShippingProviderCards from "@/features/shipping-information/components/ShippingProviderCards"

export default function ShippingMethodsComparison() {
  return (
    <PageSectionContainer as="section" className="py-12 sm:py-16 lg:py-20">
      <SectionHeading
        title="Shipping Methods"
        description="Choose the delivery solution that fits your operational requirements"
        className="mb-8 sm:mb-12 justify-center"
        titleClassName="text-2xl sm:text-3xl lg:text-4xl text-center mb-3 sm:mb-4"
        descriptionClassName="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-center"
      />
      <ShippingMethodsTable />
      <ShippingProviderCards />
    </PageSectionContainer>
  )
}
