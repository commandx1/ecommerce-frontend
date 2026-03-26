import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import OrderTrackingAccessCard from "@/features/shipping-information/components/OrderTrackingAccessCard"
import OrderTrackingProviderCards from "@/features/shipping-information/components/OrderTrackingProviderCards"
import OrderTrackingStatusBanner from "@/features/shipping-information/components/OrderTrackingStatusBanner"

export default function OrderTrackingSection() {
  return (
    <PageSectionContainer as="section" className="py-12 sm:py-16 lg:py-20 bg-white">
      <SectionHeading
        title="Order Tracking"
        description="Monitor your shipment from fulfillment to delivery with real-time updates"
        className="mb-8 sm:mb-12 justify-center"
        titleClassName="text-2xl sm:text-3xl lg:text-4xl text-center mb-3 sm:mb-4"
        descriptionClassName="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-center"
      />

      <OrderTrackingStatusBanner />
      <OrderTrackingProviderCards />
      <OrderTrackingAccessCard />
    </PageSectionContainer>
  )
}
