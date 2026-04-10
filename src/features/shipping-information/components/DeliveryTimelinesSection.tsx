import PageSectionContainer from "@/components/layout/PageSectionContainer"
import DeliveryConsiderationsCard from "@/features/shipping-information/components/DeliveryConsiderationsCard"
import DeliveryCutoffTimesCard from "@/features/shipping-information/components/DeliveryCutoffTimesCard"
import DeliverySpeedComparisonCard from "@/features/shipping-information/components/DeliverySpeedComparisonCard"
import DeliveryTimelineProcessCard from "@/features/shipping-information/components/DeliveryTimelineProcessCard"
import ShippingSectionHeading from "@/features/shipping-information/components/ShippingSectionHeading"

export default function DeliveryTimelinesSection() {
  return (
    <PageSectionContainer as="section" className="bg-canvas py-12 sm:py-16 lg:py-20">
      <ShippingSectionHeading
        title="Delivery Timelines"
        description="Understanding processing times and expected delivery windows"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-12">
        <DeliveryTimelineProcessCard />
        <div className="space-y-6 sm:space-y-8">
          <DeliveryCutoffTimesCard />
          <DeliveryConsiderationsCard />
        </div>
      </div>

      <DeliverySpeedComparisonCard />
    </PageSectionContainer>
  )
}
