import PageSectionContainer from "@/components/layout/PageSectionContainer"
import OrderTrackingAccessCard from "@/features/shipping-information/components/OrderTrackingAccessCard"
import OrderTrackingProviderCards from "@/features/shipping-information/components/OrderTrackingProviderCards"
import OrderTrackingStatusBanner from "@/features/shipping-information/components/OrderTrackingStatusBanner"
import ShippingSectionHeading from "@/features/shipping-information/components/ShippingSectionHeading"

export default function OrderTrackingSection() {
  return (
    <PageSectionContainer as="section" className="bg-canvas py-12 sm:py-16 lg:py-20">
      <ShippingSectionHeading
        title="Order Tracking"
        description="Monitor your shipment from fulfillment to delivery with real-time updates"
      />

      <OrderTrackingStatusBanner />
      <OrderTrackingProviderCards />
      <OrderTrackingAccessCard />
    </PageSectionContainer>
  )
}
