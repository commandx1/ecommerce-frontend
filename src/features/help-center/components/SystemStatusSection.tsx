import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import SystemAnnouncementsPanel from "@/features/help-center/components/system-status/SystemAnnouncementsPanel"
import SystemStatusPanel from "@/features/help-center/components/system-status/SystemStatusPanel"
import {
  SYSTEM_ANNOUNCEMENTS,
  SYSTEM_STATUS_ITEMS,
} from "@/features/help-center/components/system-status/systemStatusData"

export default function SystemStatusSection() {
  return (
    <PageSectionContainer as="section" className="py-16 bg-white">
      <SectionHeading
        title="System Status & Updates"
        description="Stay informed about platform performance, scheduled maintenance, and new feature releases"
        className="mb-12 justify-center"
        titleClassName="text-4xl text-center mb-4"
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SystemStatusPanel items={SYSTEM_STATUS_ITEMS} />
        <SystemAnnouncementsPanel announcements={SYSTEM_ANNOUNCEMENTS} />
      </div>
    </PageSectionContainer>
  )
}
