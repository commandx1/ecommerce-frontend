import DeliveryTimelinesSection from "@/features/shipping-information/components/DeliveryTimelinesSection"
import OrderTrackingSection from "@/features/shipping-information/components/OrderTrackingSection"
import PackagingResponsibilitySection from "@/features/shipping-information/components/PackagingResponsibilitySection"
import ShippingCostStructureSection from "@/features/shipping-information/components/ShippingCostStructureSection"
import ShippingFAQSection from "@/features/shipping-information/components/ShippingFAQSection"
import ShippingHero from "@/features/shipping-information/components/ShippingHero"
import ShippingMethodsComparison from "@/features/shipping-information/components/ShippingMethodsComparison"
import SupportCTASection from "@/features/shipping-information/components/SupportCTASection"

export default function ShippingInformationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShippingHero />
      <ShippingMethodsComparison />
      <DeliveryTimelinesSection />
      <ShippingCostStructureSection />
      <OrderTrackingSection />
      <PackagingResponsibilitySection />
      <ShippingFAQSection />
      <SupportCTASection />
    </div>
  )
}
