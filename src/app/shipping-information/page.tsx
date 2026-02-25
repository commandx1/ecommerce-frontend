import DeliveryTimelinesSection from "./components/DeliveryTimelinesSection"
import OrderTrackingSection from "./components/OrderTrackingSection"
import PackagingResponsibilitySection from "./components/PackagingResponsibilitySection"
import ShippingCostStructureSection from "./components/ShippingCostStructureSection"
import ShippingFAQSection from "./components/ShippingFAQSection"
import ShippingHero from "./components/ShippingHero"
import ShippingMethodsComparison from "./components/ShippingMethodsComparison"
import SupportCTASection from "./components/SupportCTASection"

export default function ShippingInformationPage() {
  return (
    <div className="min-h-screen bg-light-mint-gray">
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
