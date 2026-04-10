import SectionCardsBlock from "@/features/legal/components/document-section/blocks/SectionCardsBlock"
import SectionCertificationsBlock from "@/features/legal/components/document-section/blocks/SectionCertificationsBlock"
import SectionCookieTypesBlock from "@/features/legal/components/document-section/blocks/SectionCookieTypesBlock"
import SectionDeviceClassesBlock from "@/features/legal/components/document-section/blocks/SectionDeviceClassesBlock"
import {
  SectionItems,
  SectionList,
  SectionWarningItems,
} from "@/features/legal/components/document-section/blocks/SectionListBlocks"
import SectionManagementOptionsBlock from "@/features/legal/components/document-section/blocks/SectionManagementOptionsBlock"
import SectionPaymentOptionsBlock from "@/features/legal/components/document-section/blocks/SectionPaymentOptionsBlock"
import SectionPricingBlock from "@/features/legal/components/document-section/blocks/SectionPricingBlock"
import SectionReportsBlock from "@/features/legal/components/document-section/blocks/SectionReportsBlock"
import SectionSecurityStandardsBlock from "@/features/legal/components/document-section/blocks/SectionSecurityStandardsBlock"
import SectionStepsBlock from "@/features/legal/components/document-section/blocks/SectionStepsBlock"
import type { LegalSection } from "@/features/legal/types"

interface DocumentSectionContentProps {
  section: LegalSection
}

export default function DocumentSectionContent({ section }: DocumentSectionContentProps) {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xl font-semibold text-text-primary">{section.title}</h3>
      {section.content ? <p className="mb-6 leading-relaxed text-text-secondary">{section.content}</p> : null}
      {section.list ? <SectionList items={section.list} /> : null}
      {section.items && section.warning ? <SectionWarningItems items={section.items} /> : null}
      {section.items && !section.warning ? <SectionItems items={section.items} /> : null}
      {section.cards ? <SectionCardsBlock cards={section.cards} /> : null}
      {section.pricing ? <SectionPricingBlock pricing={section.pricing} /> : null}
      {section.steps ? <SectionStepsBlock steps={section.steps} /> : null}
      {section.paymentOptions ? <SectionPaymentOptionsBlock options={section.paymentOptions} /> : null}
      {section.cookieTypes ? <SectionCookieTypesBlock cookies={section.cookieTypes} /> : null}
      {section.managementOptions ? <SectionManagementOptionsBlock options={section.managementOptions} /> : null}
      {section.deviceClasses ? <SectionDeviceClassesBlock deviceClasses={section.deviceClasses} /> : null}
      {section.certifications ? <SectionCertificationsBlock certifications={section.certifications} /> : null}
      {section.securityStandards ? <SectionSecurityStandardsBlock standards={section.securityStandards} /> : null}
      {section.reports ? <SectionReportsBlock reports={section.reports} /> : null}
    </div>
  )
}
