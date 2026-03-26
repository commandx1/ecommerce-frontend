import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import DamagedGoodsReportingCard from "@/features/shipping-information/components/DamagedGoodsReportingCard"
import InsuranceLiabilityCard from "@/features/shipping-information/components/InsuranceLiabilityCard"
import ProfessionalPackagingCard from "@/features/shipping-information/components/ProfessionalPackagingCard"

export default function PackagingResponsibilitySection() {
  return (
    <PageSectionContainer as="section" className="py-12 sm:py-16 lg:py-20">
      <SectionHeading
        title="Packaging & Responsibility"
        description="Professional handling and clear liability guidelines for your peace of mind"
        className="mb-8 sm:mb-12 justify-center"
        titleClassName="text-2xl sm:text-3xl lg:text-4xl text-center mb-3 sm:mb-4"
        descriptionClassName="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-center"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
        <ProfessionalPackagingCard />
        <InsuranceLiabilityCard />
      </div>
      <DamagedGoodsReportingCard />
    </PageSectionContainer>
  )
}
