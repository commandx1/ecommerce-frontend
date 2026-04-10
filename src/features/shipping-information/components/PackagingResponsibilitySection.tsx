import PageSectionContainer from "@/components/layout/PageSectionContainer"
import DamagedGoodsReportingCard from "@/features/shipping-information/components/DamagedGoodsReportingCard"
import InsuranceLiabilityCard from "@/features/shipping-information/components/InsuranceLiabilityCard"
import ProfessionalPackagingCard from "@/features/shipping-information/components/ProfessionalPackagingCard"
import ShippingSectionHeading from "@/features/shipping-information/components/ShippingSectionHeading"

export default function PackagingResponsibilitySection() {
  return (
    <PageSectionContainer as="section" className="bg-surface py-12 sm:py-16 lg:py-20">
      <ShippingSectionHeading
        title="Packaging & Responsibility"
        description="Professional handling and clear liability guidelines for your peace of mind"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
        <ProfessionalPackagingCard />
        <InsuranceLiabilityCard />
      </div>
      <DamagedGoodsReportingCard />
    </PageSectionContainer>
  )
}
