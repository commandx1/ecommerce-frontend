import DeliveryConsiderationsCard from "@/features/shipping-information/components/DeliveryConsiderationsCard"
import DeliveryCutoffTimesCard from "@/features/shipping-information/components/DeliveryCutoffTimesCard"
import DeliverySpeedComparisonCard from "@/features/shipping-information/components/DeliverySpeedComparisonCard"
import DeliveryTimelineProcessCard from "@/features/shipping-information/components/DeliveryTimelineProcessCard"

export default function DeliveryTimelinesSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">
            Delivery Timelines
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding processing times and expected delivery windows
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <DeliveryTimelineProcessCard />
          <div className="space-y-6 sm:space-y-8">
            <DeliveryCutoffTimesCard />
            <DeliveryConsiderationsCard />
          </div>
        </div>

        <DeliverySpeedComparisonCard />
      </div>
    </section>
  )
}
