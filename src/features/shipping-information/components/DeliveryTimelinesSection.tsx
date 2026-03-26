import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import DeliveryConsiderationsCard from "@/features/shipping-information/components/DeliveryConsiderationsCard"
import DeliveryCutoffTimesCard from "@/features/shipping-information/components/DeliveryCutoffTimesCard"
import DeliverySpeedComparisonCard from "@/features/shipping-information/components/DeliverySpeedComparisonCard"
import DeliveryTimelineProcessCard from "@/features/shipping-information/components/DeliveryTimelineProcessCard"

export default function DeliveryTimelinesSection() {
  return (
    <PageSectionContainer as="section" className="py-12 sm:py-16 lg:py-20 bg-white">
      <SectionHeading
        title="Delivery Timelines"
        description="Understanding processing times and expected delivery windows"
        className="mb-8 sm:mb-12 justify-center"
        titleClassName="text-2xl sm:text-3xl lg:text-4xl text-center mb-3 sm:mb-4"
        descriptionClassName="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-center"
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
