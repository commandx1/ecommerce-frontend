import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ShippingMethodsTable from "@/features/shipping-information/components/ShippingMethodsTable"
import ShippingProviderCards from "@/features/shipping-information/components/ShippingProviderCards"
import ShippingSectionHeading from "@/features/shipping-information/components/ShippingSectionHeading"

export default function ShippingMethodsComparison() {
  return (
    <PageSectionContainer as="section" className="bg-surface py-12 sm:py-16 lg:py-20">
      <ShippingSectionHeading
        title="Shipping Methods"
        description="Choose the delivery solution that fits your operational requirements"
      />
      <ShippingMethodsTable />
      <ShippingProviderCards />
    </PageSectionContainer>
  )
}
